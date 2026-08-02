import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { isRedisStore, setDoc, getDoc, listDocs, deleteDoc } from "./redis";

export type { FeedbackEntry, ResponseChannel, Rating } from "./feedback-types";
export {
  RESPONSE_CHANNEL_LABELS,
  RATING_LABELS,
} from "./feedback-types";
import type { FeedbackEntry } from "./feedback-types";

const DATA_DIR = path.join(process.cwd(), "data", "feedback");
const COLLECTION = "feedback";

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

  if (isRedisStore()) {
    await setDoc(COLLECTION, id, record);
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

  if (isRedisStore()) {
    await setDoc(COLLECTION, id, updated);
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

  if (isRedisStore()) {
    try {
      const records = await listDocs<FeedbackEntry>(COLLECTION);
      return records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    } catch (err) {
      console.error("[feedback-store] listFeedback failed:", err);
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

  if (isRedisStore()) {
    try {
      return await getDoc<FeedbackEntry>(COLLECTION, id);
    } catch (err) {
      console.error("[feedback-store] getFeedback failed:", err);
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
  if (isRedisStore()) {
    try {
      return await deleteDoc(COLLECTION, id);
    } catch (err) {
      console.error("[feedback-store] deleteFeedback failed:", err);
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
