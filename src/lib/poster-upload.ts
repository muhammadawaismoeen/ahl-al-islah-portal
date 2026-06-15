import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function isBlobStore(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function safeExt(name: string, fallback = "jpg"): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXT.has(ext) ? ext : fallback;
}

/**
 * Upload a session poster image. Returns a public URL string (Vercel Blob in
 * prod, /uploads/... in dev) or null when the input is empty / rejected.
 *
 * Caller is expected to have validated the file came from an authenticated
 * admin form.
 */
export async function uploadSessionPoster(
  file: File | null
): Promise<string | null> {
  if (!file || typeof file === "string") return null;
  if (file.size === 0 || file.size > MAX_BYTES) return null;
  if (!file.type.startsWith("image/")) return null;

  const ext = safeExt(file.name);
  const id = `${Date.now().toString(36)}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
  const key = `sessions/posters/${id}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isBlobStore()) {
    const { put } = await import("@vercel/blob");
    const result = await put(key, bytes, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: file.type,
    });
    return result.url;
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

  if (isBlobStore() && /^https?:\/\//.test(url)) {
    try {
      const { del } = await import("@vercel/blob");
      await del(url);
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
  }
}
