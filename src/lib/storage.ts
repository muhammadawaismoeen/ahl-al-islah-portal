import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";

export interface StoredSubmission {
  id: string;
  positionSlug: string;
  positionTitle: string;
  wing: string;
  submittedAt: string;
  ip?: string;
  data: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  Env helpers                                                       */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), "data", "submissions");
const BLOB_PREFIX = "submissions/";

function isBlobStore(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ------------------------------------------------------------------ */
/*  saveSubmission                                                    */
/* ------------------------------------------------------------------ */

export async function saveSubmission(
  input: Omit<StoredSubmission, "id" | "submittedAt">
): Promise<StoredSubmission> {
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const record: StoredSubmission = {
    id,
    submittedAt: new Date().toISOString(),
    ...input,
  };

  if (isBlobStore()) {
    const { put } = await import("@vercel/blob");
    await put(`${BLOB_PREFIX}${id}.json`, JSON.stringify(record, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } else {
    await ensureDir();
    const file = path.join(DATA_DIR, `${id}.json`);
    await fs.writeFile(file, JSON.stringify(record, null, 2), "utf8");
  }

  return record;
}

/* ------------------------------------------------------------------ */
/*  listSubmissions                                                   */
/* ------------------------------------------------------------------ */

export async function listSubmissions(): Promise<StoredSubmission[]> {
  noStore();

  if (isBlobStore()) {
    try {
      const { list } = await import("@vercel/blob");
      const records: StoredSubmission[] = [];
      let cursor: string | undefined;

      // Paginate through all blobs with the submissions/ prefix
      do {
        const result = await list({
          prefix: BLOB_PREFIX,
          ...(cursor ? { cursor } : {}),
        });
        const fetches = result.blobs.map(async (blob) => {
          try {
            const res = await fetch(blob.url, { cache: "no-store" });
            return (await res.json()) as StoredSubmission;
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

      return records.sort((a, b) =>
        b.submittedAt.localeCompare(a.submittedAt)
      );
    } catch {
      return [];
    }
  }

  // Local filesystem fallback
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const records = await Promise.all(
    jsonFiles.map(async (f) => {
      try {
        const raw = await fs.readFile(path.join(DATA_DIR, f), "utf8");
        return JSON.parse(raw) as StoredSubmission;
      } catch {
        return null;
      }
    })
  );
  return records
    .filter((r): r is StoredSubmission => r !== null)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/* ------------------------------------------------------------------ */
/*  getSubmission                                                     */
/* ------------------------------------------------------------------ */

export async function getSubmission(
  id: string
): Promise<StoredSubmission | null> {
  noStore();

  if (isBlobStore()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({
        prefix: `${BLOB_PREFIX}${id}.json`,
        limit: 1,
      });
      if (blobs.length === 0) return null;
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      return (await res.json()) as StoredSubmission;
    } catch {
      return null;
    }
  }

  // Local filesystem fallback
  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as StoredSubmission;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  deleteSubmission                                                  */
/* ------------------------------------------------------------------ */

export async function deleteSubmission(id: string): Promise<boolean> {
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

  // Local filesystem fallback
  try {
    await fs.unlink(path.join(DATA_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}
