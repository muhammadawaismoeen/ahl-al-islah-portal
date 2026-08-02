import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { isRedisStore, setDoc, getDoc, deleteDoc } from "./redis";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
/** Upstash REST requests cap out around 1 MB; base64 inflates by ~33%, so
 *  600 KB of raw image is the safe ceiling for a single stored poster. */
export const MAX_POSTER_BYTES = 600 * 1024;

const COLLECTION = "posters";
export const POSTER_URL_PREFIX = "/api/posters/";

/** A poster image stored in Redis and served by /api/posters/[id]. */
export interface StoredPoster {
  id: string;
  contentType: string;
  size: number;
  createdAt: string;
  /** base64-encoded image bytes */
  data: string;
}

function safeExt(name: string, fallback = "jpg"): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXT.has(ext) ? ext : fallback;
}

export async function getStoredPoster(
  id: string
): Promise<StoredPoster | null> {
  if (!isRedisStore()) return null;
  try {
    return await getDoc<StoredPoster>(COLLECTION, id);
  } catch (err) {
    console.error("[poster-upload] getStoredPoster failed:", err);
    return null;
  }
}

/**
 * Upload a session poster image. Returns a public URL string
 * (/api/posters/<id> in prod via Redis, /uploads/... in dev) or null when
 * the input is empty / rejected.
 *
 * Caller is expected to have validated the file came from an authenticated
 * admin form.
 */
export async function uploadSessionPoster(
  file: File | null
): Promise<string | null> {
  if (!file || typeof file === "string") return null;
  if (file.size === 0 || file.size > MAX_POSTER_BYTES) return null;
  if (!file.type.startsWith("image/")) return null;

  const ext = safeExt(file.name);
  const id = `${Date.now().toString(36)}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isRedisStore()) {
    const poster: StoredPoster = {
      id,
      contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
      size: bytes.length,
      createdAt: new Date().toISOString(),
      data: bytes.toString("base64"),
    };
    await setDoc(COLLECTION, id, poster);
    return `${POSTER_URL_PREFIX}${id}`;
  }

  const localDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "sessions",
    "posters"
  );
  await fs.mkdir(localDir, { recursive: true });
  await fs.writeFile(path.join(localDir, `${id}.${ext}`), bytes);
  return `/uploads/sessions/posters/${id}.${ext}`;
}

/**
 * Best-effort poster delete. Silent on failure — orphaned files are tolerable.
 */
export async function deleteSessionPoster(url?: string | null): Promise<void> {
  if (!url) return;

  if (url.startsWith(POSTER_URL_PREFIX)) {
    const id = url.slice(POSTER_URL_PREFIX.length);
    try {
      await deleteDoc(COLLECTION, id);
    } catch {
      // ignore
    }
    return;
  }

  if (url.startsWith("/uploads/")) {
    try {
      await fs.unlink(path.join(process.cwd(), "public", url));
    } catch {
      // ignore
    }
    return;
  }

  // Legacy: posters uploaded before the Redis migration live on Vercel Blob.
  if (/^https?:\/\//.test(url) && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import("@vercel/blob");
      await del(url);
    } catch {
      // ignore
    }
  }
}
