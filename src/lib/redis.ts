import { Redis } from "@upstash/redis";

/**
 * Upstash Redis data layer. Every collection stores one JSON document per
 * record under `aai:<collection>:<id>` plus a SET of ids at
 * `aai:<collection>:index`, so listing is SMEMBERS + MGET — strongly
 * consistent, unlike the old Vercel Blob list() index.
 *
 * Env: the Vercel↔Upstash integration injects KV_REST_API_URL /
 * KV_REST_API_TOKEN; a standalone Upstash setup uses UPSTASH_REDIS_REST_*.
 * Both are accepted. When neither is set (local dev), stores fall back to
 * the filesystem under /data.
 */

function restUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
}

function restToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
}

export function isRedisStore(): boolean {
  return !!(restUrl() && restToken());
}

let client: Redis | null = null;

export function redis(): Redis {
  if (!client) {
    const url = restUrl();
    const token = restToken();
    if (!url || !token) {
      throw new Error(
        "Upstash Redis is not configured — set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN."
      );
    }
    client = new Redis({ url, token });
  }
  return client;
}

const docKey = (collection: string, id: string) => `aai:${collection}:${id}`;
const indexKey = (collection: string) => `aai:${collection}:index`;

export async function setDoc<T>(
  collection: string,
  id: string,
  doc: T
): Promise<void> {
  const p = redis().pipeline();
  p.set(docKey(collection, id), doc);
  p.sadd(indexKey(collection), id);
  await p.exec();
}

export async function getDoc<T>(
  collection: string,
  id: string
): Promise<T | null> {
  return (await redis().get<T>(docKey(collection, id))) ?? null;
}

export async function listDocs<T>(collection: string): Promise<T[]> {
  const r = redis();
  const ids = await r.smembers(indexKey(collection));
  if (ids.length === 0) return [];
  const rows = (await r.mget(...ids.map((id) => docKey(collection, id)))) as (
    | T
    | null
  )[];
  return rows.filter((row): row is T => row !== null);
}

export async function deleteDoc(
  collection: string,
  id: string
): Promise<boolean> {
  const p = redis().pipeline();
  p.del(docKey(collection, id));
  p.srem(indexKey(collection), id);
  const [deleted] = (await p.exec()) as [number, number];
  return deleted > 0;
}
