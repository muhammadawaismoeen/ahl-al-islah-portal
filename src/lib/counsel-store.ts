import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";

export type {
  CounselCohort,
  CounselMessage,
  CounselMessageAuthor,
  CounselThread,
  CounselThreadStatus,
} from "./counsel-types";
export { COHORT_LABELS } from "./counsel-types";

import type {
  CounselCohort,
  CounselMessage,
  CounselMessageAuthor,
  CounselThread,
  CounselThreadStatus,
} from "./counsel-types";

const DATA_DIR = path.join(process.cwd(), "data", "counsel");
const BLOB_PREFIX = "counsel/";

function isBlobStore(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ------------------------------------------------------------------ */
/*  Claim-code helpers                                                */
/* ------------------------------------------------------------------ */

export function generateClaimCode(): string {
  const hex = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `NS-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export function hashClaimCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");
}

/* ------------------------------------------------------------------ */
/*  Persistence primitives                                             */
/* ------------------------------------------------------------------ */

/** Blob content is CDN-cached (stale up to ~60s after overwrite) and the blob
 *  index is eventually consistent. Reads must bust the cache; reads of brand-new
 *  threads must go through the direct URL captured at write time. */
function withCacheBust(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}cb=${Date.now()}`;
}

function isSafeBlobUrl(url: string, threadId: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com") &&
      u.pathname === `/${BLOB_PREFIX}${threadId}.json`
    );
  } catch {
    return false;
  }
}

/** Returns the blob's direct URL in prod, null with the local file store. */
async function writeThread(thread: CounselThread): Promise<string | null> {
  const payload = JSON.stringify(thread, null, 2);
  if (isBlobStore()) {
    const { put } = await import("@vercel/blob");
    // No cacheControlMaxAge here: reads always cache-bust with a unique query
    // param, so the default CDN TTL never serves us stale content anyway.
    const { url } = await put(`${BLOB_PREFIX}${thread.id}.json`, payload, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return url;
  }
  await ensureDir();
  await fs.writeFile(
    path.join(DATA_DIR, `${thread.id}.json`),
    payload,
    "utf8"
  );
  return null;
}

/* ------------------------------------------------------------------ */
/*  createThread                                                       */
/* ------------------------------------------------------------------ */

export async function createThread(input: {
  firstMessage: string;
  cohort?: CounselCohort;
  claimCode: string;
}): Promise<{ thread: CounselThread; blobUrl: string | null }> {
  const now = new Date().toISOString();
  const threadId = `ct-${Date.now().toString(36)}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
  const firstMessage: CounselMessage = {
    id: `cm-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`,
    from: "seeker",
    body: input.firstMessage,
    submittedAt: now,
  };
  const thread: CounselThread = {
    id: threadId,
    claimCodeHash: hashClaimCode(input.claimCode),
    cohort: input.cohort,
    createdAt: now,
    updatedAt: now,
    status: "open",
    advisorHasUnread: true,
    seekerHasUnread: false,
    messages: [firstMessage],
  };
  const blobUrl = await writeThread(thread);
  return { thread, blobUrl };
}

/* ------------------------------------------------------------------ */
/*  addMessage                                                         */
/* ------------------------------------------------------------------ */

export async function addMessage(
  threadId: string,
  from: CounselMessageAuthor,
  body: string,
  preloaded?: CounselThread
): Promise<boolean> {
  const thread = preloaded ?? (await getThread(threadId));
  if (!thread) return false;
  const now = new Date().toISOString();
  const msg: CounselMessage = {
    id: `cm-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`,
    from,
    body,
    submittedAt: now,
  };
  const updated: CounselThread = {
    ...thread,
    updatedAt: now,
    messages: [...thread.messages, msg],
    advisorHasUnread: from === "seeker" ? true : false,
    seekerHasUnread: from === "advisor" ? true : false,
  };
  await writeThread(updated);
  return true;
}

/* ------------------------------------------------------------------ */
/*  markSeekerRead / markAdvisorRead                                   */
/* ------------------------------------------------------------------ */

export async function markSeekerRead(
  threadId: string,
  preloaded?: CounselThread
): Promise<boolean> {
  const thread = preloaded ?? (await getThread(threadId));
  if (!thread) return false;
  if (!thread.seekerHasUnread) return true;
  await writeThread({ ...thread, seekerHasUnread: false });
  return true;
}

export async function markAdvisorRead(threadId: string): Promise<boolean> {
  const thread = await getThread(threadId);
  if (!thread) return false;
  if (!thread.advisorHasUnread) return true;
  await writeThread({ ...thread, advisorHasUnread: false });
  return true;
}

/* ------------------------------------------------------------------ */
/*  setThreadStatus                                                    */
/* ------------------------------------------------------------------ */

export async function setThreadStatus(
  threadId: string,
  status: CounselThreadStatus
): Promise<boolean> {
  const thread = await getThread(threadId);
  if (!thread) return false;
  await writeThread({
    ...thread,
    status,
    updatedAt: new Date().toISOString(),
  });
  return true;
}

/* ------------------------------------------------------------------ */
/*  listThreads                                                        */
/* ------------------------------------------------------------------ */

export async function listThreads(): Promise<CounselThread[]> {
  noStore();

  if (isBlobStore()) {
    try {
      const { list } = await import("@vercel/blob");
      const records: CounselThread[] = [];
      let cursor: string | undefined;

      do {
        const result = await list({
          prefix: BLOB_PREFIX,
          ...(cursor ? { cursor } : {}),
        });
        const fetches = result.blobs.map(async (blob) => {
          try {
            const res = await fetch(withCacheBust(blob.url), {
              cache: "no-store",
            });
            return (await res.json()) as CounselThread;
          } catch {
            return null;
          }
        });
        const batch = await Promise.all(fetches);
        for (const r of batch) {
          if (r) records.push(r);
        }
        cursor = result.hasMore ? result.cursor : undefined;
      } while (cursor);

      return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch {
      return [];
    }
  }

  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const records = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => {
        try {
          const raw = await fs.readFile(path.join(DATA_DIR, f), "utf8");
          return JSON.parse(raw) as CounselThread;
        } catch {
          return null;
        }
      })
  );
  return records
    .filter((r): r is CounselThread => r !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/* ------------------------------------------------------------------ */
/*  getThread                                                          */
/* ------------------------------------------------------------------ */

export async function getThread(
  id: string,
  hintUrl?: string | null
): Promise<CounselThread | null> {
  noStore();

  if (isBlobStore()) {
    // Direct URL (from the cookie set at creation): skips the eventually-
    // consistent index entirely, so brand-new threads resolve immediately.
    if (hintUrl && isSafeBlobUrl(hintUrl, id)) {
      try {
        const res = await fetch(withCacheBust(hintUrl), { cache: "no-store" });
        if (res.ok) {
          const t = (await res.json()) as CounselThread;
          if (t?.id === id) return t;
        }
      } catch {
        // fall through to index lookup
      }
    }
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({
        prefix: `${BLOB_PREFIX}${id}.json`,
        limit: 1,
      });
      if (blobs.length === 0) return null;
      const res = await fetch(withCacheBust(blobs[0].url), {
        cache: "no-store",
      });
      return (await res.json()) as CounselThread;
    } catch {
      return null;
    }
  }

  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as CounselThread;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  findThreadByClaimCode                                              */
/* ------------------------------------------------------------------ */

export async function findThreadByClaimCode(
  code: string
): Promise<CounselThread | null> {
  const target = hashClaimCode(code);
  const all = await listThreads();
  return all.find((t) => t.claimCodeHash === target) ?? null;
}

/* ------------------------------------------------------------------ */
/*  deleteThread                                                       */
/* ------------------------------------------------------------------ */

export async function deleteThread(id: string): Promise<boolean> {
  if (isBlobStore()) {
    try {
      const { list, del } = await import("@vercel/blob");
      const { blobs } = await list({
        prefix: `${BLOB_PREFIX}${id}.json`,
        limit: 1,
      });
      if (blobs.length === 0) return false;
      await del(blobs[0].url);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await fs.unlink(path.join(DATA_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}
