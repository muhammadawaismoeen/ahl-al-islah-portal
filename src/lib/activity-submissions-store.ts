import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { isRedisStore, setDoc, getDoc, listDocs, deleteDoc } from "./redis";

export type {
  IdentityPillarsSubmission,
  IdentityPillar,
  PillarType,
} from "./activity-submissions-types";
export {
  PILLAR_TYPE_LABELS,
  PILLAR_TYPE_DESCRIPTIONS,
} from "./activity-submissions-types";
import type { IdentityPillarsSubmission } from "./activity-submissions-types";

const DATA_DIR = path.join(process.cwd(), "data", "activity-submissions");
const COLLECTION = "activity-submissions";

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ------------------------------------------------------------------ */
/*  saveSubmission                                                     */
/* ------------------------------------------------------------------ */

export async function saveSubmission(
  input: Omit<IdentityPillarsSubmission, "id" | "submittedAt" | "status">
): Promise<IdentityPillarsSubmission> {
  const id = `act-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const record: IdentityPillarsSubmission = {
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
/*  updateSubmission (mark read)                                       */
/* ------------------------------------------------------------------ */

export async function updateSubmission(
  id: string,
  patch: Partial<Pick<IdentityPillarsSubmission, "status">>
): Promise<boolean> {
  const existing = await getSubmission(id);
  if (!existing) return false;

  const updated: IdentityPillarsSubmission = { ...existing, ...patch };

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
/*  listSubmissions                                                    */
/* ------------------------------------------------------------------ */

export async function listSubmissions(): Promise<IdentityPillarsSubmission[]> {
  noStore();

  if (isRedisStore()) {
    try {
      const records = await listDocs<IdentityPillarsSubmission>(COLLECTION);
      return records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    } catch (err) {
      console.error("[activity-submissions-store] listSubmissions failed:", err);
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
          return JSON.parse(raw) as IdentityPillarsSubmission;
        } catch {
          return null;
        }
      })
  );
  return records
    .filter((r): r is IdentityPillarsSubmission => r !== null)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/* ------------------------------------------------------------------ */
/*  getSubmission                                                      */
/* ------------------------------------------------------------------ */

export async function getSubmission(
  id: string
): Promise<IdentityPillarsSubmission | null> {
  noStore();

  if (isRedisStore()) {
    try {
      return await getDoc<IdentityPillarsSubmission>(COLLECTION, id);
    } catch (err) {
      console.error("[activity-submissions-store] getSubmission failed:", err);
      return null;
    }
  }

  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as IdentityPillarsSubmission;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  deleteSubmission                                                   */
/* ------------------------------------------------------------------ */

export async function deleteSubmission(id: string): Promise<boolean> {
  if (isRedisStore()) {
    try {
      return await deleteDoc(COLLECTION, id);
    } catch (err) {
      console.error("[activity-submissions-store] deleteSubmission failed:", err);
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
