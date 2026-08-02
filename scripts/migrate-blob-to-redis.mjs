/**
 * One-way, idempotent migration: Vercel Blob -> Upstash Redis.
 *
 * Runs as part of `npm run build` (see package.json) so that on Vercel —
 * where BLOB_READ_WRITE_TOKEN and the KV_* Redis env vars are both present
 * at build time — the data is copied BEFORE the Redis-backed code starts
 * serving traffic. No admin action or auth is needed, and there is no
 * window where the site serves empty data.
 *
 * Safety properties:
 *  - Skips instantly when either side's env vars are absent (local builds).
 *  - Skip-if-exists per document (checked against the Redis index set), so
 *    re-running on every deploy never clobbers writes made after cutover.
 *  - NEVER fails the build: every section and the top level catch + log.
 *
 * Posters: images <= 600 KB are copied into Redis (as base64 docs served by
 * /api/posters/[id]) and the owning session's posterUrl is rewritten.
 * Larger posters stay on their existing blob URLs, which keep working as
 * long as the blob store is alive; each one is logged so it can be
 * re-uploaded (compressed) through the admin UI later.
 */

import { Redis } from "@upstash/redis";
import { list } from "@vercel/blob";

const REST_URL =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const MAX_POSTER_BYTES = 600 * 1024;

/** Must match src/lib/redis.ts exactly. */
const docKey = (collection, id) => `aai:${collection}:${id}`;
const indexKey = (collection) => `aai:${collection}:index`;

/** [blob prefix, redis collection] — prefixes from the pre-Redis stores. */
const JSON_COLLECTIONS = [
  ["submissions/", "submissions"],
  ["feedback/", "feedback"],
  ["messages/", "messages"],
  ["activity-submissions/", "activity-submissions"],
  ["sessions/", "sessions"],
  ["counsel/", "counsel"],
];

const POSTER_PREFIX = "sessions/posters/";

async function listAllBlobs(prefix) {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, token: BLOB_TOKEN });
    blobs.push(...page.blobs);
    cursor = page.cursor;
  } while (cursor);
  return blobs;
}

/** Blob URLs are CDN-cached aggressively; bust to read the latest version. */
async function fetchFresh(url) {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}cb=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res;
}

async function migrateJsonCollections(redis) {
  for (const [prefix, collection] of JSON_COLLECTIONS) {
    try {
      const blobs = (await listAllBlobs(prefix)).filter((b) => {
        const rest = b.pathname.slice(prefix.length);
        // Only direct <id>.json children — e.g. skip sessions/posters/*.
        return rest.endsWith(".json") && !rest.includes("/");
      });
      const existing = new Set(await redis.smembers(indexKey(collection)));
      let copied = 0;
      let skipped = 0;
      let failed = 0;
      for (const b of blobs) {
        const stem = b.pathname.slice(prefix.length, -".json".length);
        if (existing.has(stem)) {
          skipped++;
          continue;
        }
        try {
          const doc = await (await fetchFresh(b.url)).json();
          const id = typeof doc?.id === "string" && doc.id ? doc.id : stem;
          await redis
            .pipeline()
            .set(docKey(collection, id), doc)
            .sadd(indexKey(collection), id)
            .exec();
          copied++;
        } catch (err) {
          failed++;
          console.error(`[migrate] ${collection}/${stem} failed:`, err);
        }
      }
      console.log(
        `[migrate] ${collection}: ${copied} copied, ${skipped} already in Redis, ${failed} failed (${blobs.length} in blob)`
      );
    } catch (err) {
      console.error(`[migrate] collection ${collection} failed:`, err);
    }
  }
}

async function migrateContent(redis) {
  try {
    const exists = await redis.exists(docKey("content", "site"));
    if (exists) {
      console.log("[migrate] content: already in Redis");
      return;
    }
    const blobs = await listAllBlobs("content.json");
    const match = blobs.find((b) => b.pathname === "content.json");
    if (!match) {
      console.log("[migrate] content: nothing in blob (defaults will be used)");
      return;
    }
    const doc = await (await fetchFresh(match.url)).json();
    await redis
      .pipeline()
      .set(docKey("content", "site"), doc)
      .sadd(indexKey("content"), "site")
      .exec();
    console.log("[migrate] content: copied");
  } catch (err) {
    console.error("[migrate] content failed:", err);
  }
}

async function migratePosters(redis) {
  try {
    const blobs = await listAllBlobs(POSTER_PREFIX);
    const existing = new Set(await redis.smembers(indexKey("posters")));
    /** old blob URL -> new /api/posters/<id> URL */
    const urlMap = new Map();
    let copied = 0;
    let skipped = 0;
    let oversize = 0;
    let failed = 0;

    for (const b of blobs) {
      const filename = b.pathname.slice(POSTER_PREFIX.length);
      if (!filename || filename.includes("/")) continue;
      const dot = filename.lastIndexOf(".");
      const id = dot > 0 ? filename.slice(0, dot) : filename;
      const target = `/api/posters/${id}`;

      if (existing.has(id)) {
        skipped++;
        urlMap.set(b.url, target);
        if (b.downloadUrl) urlMap.set(b.downloadUrl, target);
        continue;
      }
      if (b.size > MAX_POSTER_BYTES) {
        oversize++;
        console.log(
          `[migrate] poster ${filename} is ${Math.round(b.size / 1024)} KB (> 600 KB) — left on blob; re-upload compressed via admin when convenient`
        );
        continue;
      }
      try {
        const res = await fetchFresh(b.url);
        const contentType = res.headers.get("content-type") ?? "image/jpeg";
        const buf = Buffer.from(await res.arrayBuffer());
        const poster = {
          id,
          contentType,
          size: buf.length,
          createdAt: b.uploadedAt
            ? new Date(b.uploadedAt).toISOString()
            : new Date().toISOString(),
          data: buf.toString("base64"),
        };
        await redis
          .pipeline()
          .set(docKey("posters", id), poster)
          .sadd(indexKey("posters"), id)
          .exec();
        copied++;
        urlMap.set(b.url, target);
        if (b.downloadUrl) urlMap.set(b.downloadUrl, target);
      } catch (err) {
        failed++;
        console.error(`[migrate] poster ${filename} failed:`, err);
      }
    }
    console.log(
      `[migrate] posters: ${copied} copied, ${skipped} already in Redis, ${oversize} oversize (left on blob), ${failed} failed (${blobs.length} in blob)`
    );

    // Point migrated sessions at the Redis-served poster route.
    if (urlMap.size === 0) return;
    const ids = await redis.smembers(indexKey("sessions"));
    let rewritten = 0;
    for (const sid of ids) {
      try {
        const session = await redis.get(docKey("sessions", sid));
        if (!session || typeof session !== "object") continue;
        const cur = session.posterUrl;
        if (typeof cur !== "string" || !cur) continue;
        const target = urlMap.get(cur) ?? urlMap.get(cur.split("?")[0]);
        if (target && target !== cur) {
          await redis.set(docKey("sessions", sid), {
            ...session,
            posterUrl: target,
          });
          rewritten++;
        }
      } catch (err) {
        console.error(`[migrate] posterUrl rewrite for session ${sid} failed:`, err);
      }
    }
    console.log(`[migrate] session posterUrl rewritten: ${rewritten}`);
  } catch (err) {
    console.error("[migrate] posters failed:", err);
  }
}

async function main() {
  if (!REST_URL || !REST_TOKEN) {
    console.log("[migrate] Redis env vars absent — skipping (local build)");
    return;
  }
  if (!BLOB_TOKEN) {
    console.log("[migrate] BLOB_READ_WRITE_TOKEN absent — nothing to migrate from");
    return;
  }
  const redis = new Redis({ url: REST_URL, token: REST_TOKEN });
  console.log("[migrate] blob -> redis migration starting");
  await migrateJsonCollections(redis);
  await migrateContent(redis);
  await migratePosters(redis);
  console.log("[migrate] done");
}

main().catch((err) => {
  // Never fail the build over migration — the old blob URLs still work for
  // posters, and a later deploy retries the copy.
  console.error("[migrate] failed (build continues):", err);
});
