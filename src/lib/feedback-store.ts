import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";

export type { FeedbackEntry, ResponseChannel, Rating } from "./feedback-types";
export {
  RESPONSE_CHANNEL_LABELS,
  RATING_LABELS,
} from "./feedback-types";
import type { FeedbackEntry } from "./feedback-types";

const DATA_DIR = path.join(process.cwd(), "data", "feedback");
const BLOB_PREFIX = "feedback/";

function isBlobStore(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ------------------------------------------------------------------ */
/*  saveFeedback                                                       */
/* ------------------------------------------------------------------ */

export async function saveFeedback(
  input: Omit<FeedbackEntry, "id" | "submittedAt" | "status">
): Promise<FeedbackEntry> {
  const id = `fb-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const record: FeedbackEntry = {
    id,
    submittedAt: new Date().toISOString(),
    status: "unread",
    ...input,
  };

  if (isBlobStore()) {
    const { put } = await import("@vercel/blob");
    await put(`${BLOB_PREFIX}${id}.json`, JSON.stringify(record, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  } else {
    await ensureDir();
    await fs.writeFile(
      path.join(DATA_DIR, `${id}.json`),
      JSON.stringify(record, null, 2),
      "utf8"
    );
  }

  return record;
}

/* ------------------------------------------------------------------ */
/*  updateFeedback (mark read)                                         */
/* ------------------------------------------------------------------ */

export async function updateFeedback(
  id: string,
  patch: Partial<Pick<FeedbackEntry, "status">>
): Promise<boolean> {
  const existing = await getFeedback(id);
  if (!existing) return false;

  const updated: FeedbackEntry = { ...existing, ...patch };

  if (isBlobStore()) {
    const { put } = await import("@vercel/blob");
    await put(`${BLOB_PREFIX}${id}.json`, JSON.stringify(updated, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  } else {
    await ensureDir();
    await fs.writeFile(
      path.join(DATA_DIR, `${id}.json`),
      JSON.stringify(updated, null, 2),
      "utf8"
    );
  }

  return true;
}

/* ------------------------------------------------------------------ */
/*  listFeedback                                                       */
/* ------------------------------------------------------------------ */

export async function listFeedback(): Promise<FeedbackEntry[]> {
  noStore();

  if (isBlobStore()) {
    try {
      const { list } = await import("@vercel/blob");
      const records: FeedbackEntry[] = [];
      let cursor: string | undefined;

      do {
        const result = await list({
          prefix: BLOB_PREFIX,
          ...(cursor ? { cursor } : {}),
        });
        const fetches = result.blobs.map(async (blob) => {
          try {
            const res = await fetch(blob.url, { cache: "no-store" });
            return (await res.json()) as FeedbackEntry;
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

  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const records = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => {
        try {
          const raw = await fs.readFile(path.join(DATA_DIR, f), "utf8");
          return JSON.parse(raw) as FeedbackEntry;
        } catch {
          return null;
        }
      })
  );
  return records
    .filter((r): r is FeedbackEntry => r !== null)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/* ------------------------------------------------------------------ */
/*  getFeedback                                                        */
/* ------------------------------------------------------------------ */

export async function getFeedback(id: string): Promise<FeedbackEntry | null> {
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
      return (await res.json()) as FeedbackEntry;
    } catch {
      return null;
    }
  }

  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as FeedbackEntry;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  deleteFeedback                                                     */
/* ------------------------------------------------------------------ */

export async function deleteFeedback(id: string): Promise<boolean> {
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
