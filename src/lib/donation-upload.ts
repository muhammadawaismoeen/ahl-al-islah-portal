import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { put, get, del } from "@vercel/blob";
import { isRedisStore, setDoc, getDoc, deleteDoc } from "./redis";
import { MAX_PROOF_BYTES } from "./drive-config";

export { MAX_PROOF_BYTES } from "./drive-config";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);

const COLLECTION = "donation-proofs";
export const PROOF_URL_PREFIX = "/api/donation-proofs/";

/** Metadata for a donation proof-of-transfer file. The file bytes themselves
 *  live in Vercel Blob (private access); this doc just points at them and is
 *  served, admin-only, by /api/donation-proofs/[id]. */
export interface StoredProof {
  id: string;
  contentType: string;
  size: number;
  createdAt: string;
  /** Vercel Blob URL, private access — not fetchable without BLOB_READ_WRITE_TOKEN */
  blobUrl: string;
}

function safeExt(name: string, fallback = "jpg"): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXT.has(ext) ? ext : fallback;
}

export async function getStoredProof(id: string): Promise<StoredProof | null> {
  if (!isRedisStore()) return null;
  try {
    return await getDoc<StoredProof>(COLLECTION, id);
  } catch (err) {
    console.error("[donation-upload] getStoredProof failed:", err);
    return null;
  }
}

/** Reads the actual file bytes for a stored proof, for the admin-gated
 *  download route. The Blob URL is private, so this is the only path that
 *  can produce readable bytes for it. */
export async function getProofBytes(
  id: string
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const proof = await getStoredProof(id);
  if (!proof) return null;
  const result = await get(proof.blobUrl, { access: "private" });
  if (!result?.stream) return null;
  const reader = result.stream.getReader();
  const chunks: Buffer[] = [];
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    chunks.push(Buffer.from(chunk.value));
  }
  return { bytes: Buffer.concat(chunks), contentType: proof.contentType };
}

/**
 * Upload a proof-of-transfer file (image or PDF). Returns a public URL
 * string (/api/donation-proofs/<id> in prod via Blob, /uploads/... in dev)
 * or null when the input is empty / rejected.
 */
export async function uploadDonationProof(
  file: File | null
): Promise<string | null> {
  if (!file || typeof file === "string") return null;
  if (file.size === 0 || file.size > MAX_PROOF_BYTES) return null;
  if (!file.type.startsWith("image/") && file.type !== "application/pdf")
    return null;

  const ext = safeExt(file.name);
  const id = `${Date.now().toString(36)}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isRedisStore()) {
    const contentType =
      file.type || (ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`);
    const blob = await put(`donation-proofs/${id}.${ext}`, bytes, {
      access: "private",
      contentType,
    });
    const proof: StoredProof = {
      id,
      contentType,
      size: bytes.length,
      createdAt: new Date().toISOString(),
      blobUrl: blob.url,
    };
    await setDoc(COLLECTION, id, proof);
    return `${PROOF_URL_PREFIX}${id}`;
  }

  const localDir = path.join(process.cwd(), "public", "uploads", "drive", "proofs");
  await fs.mkdir(localDir, { recursive: true });
  await fs.writeFile(path.join(localDir, `${id}.${ext}`), bytes);
  return `/uploads/drive/proofs/${id}.${ext}`;
}

/** Best-effort proof delete. Silent on failure — orphaned files are tolerable. */
export async function deleteDonationProof(url?: string | null): Promise<void> {
  if (!url) return;

  if (url.startsWith(PROOF_URL_PREFIX)) {
    const id = url.slice(PROOF_URL_PREFIX.length);
    try {
      const proof = await getDoc<StoredProof>(COLLECTION, id);
      if (proof?.blobUrl) {
        await del(proof.blobUrl);
      }
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
  }
}
