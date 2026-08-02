import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { isRedisStore, setDoc, getDoc, listDocs, deleteDoc } from "./redis";

export interface StoredSubmission {
  id: string;
  positionSlug: string;
  positionTitle: string;
  wing: string;
  submittedAt: string;
  ip?: string;
  data: Record<string, unknown>;
}

const DATA_DIR = path.join(process.cwd(), "data", "submissions");
const COLLECTION = "submissions";

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

  if (isRedisStore()) {
    await setDoc(COLLECTION, id, record);
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

  if (isRedisStore()) {
    try {
      const records = await listDocs<StoredSubmission>(COLLECTION);
      return records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    } catch (err) {
      console.error("[storage] listSubmissions failed:", err);
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

  if (isRedisStore()) {
    try {
      return await getDoc<StoredSubmission>(COLLECTION, id);
    } catch (err) {
      console.error("[storage] getSubmission failed:", err);
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
  if (isRedisStore()) {
    try {
      return await deleteDoc(COLLECTION, id);
    } catch (err) {
      console.error("[storage] deleteSubmission failed:", err);
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
