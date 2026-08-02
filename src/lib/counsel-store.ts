import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { isRedisStore, setDoc, getDoc, listDocs, deleteDoc } from "./redis";

export type {
  CounselCohort,
  CounselMessage,
  CounselMessageAuthor,
  CounselThread,
  CounselThreadStatus,
} from "./counsel-types";
export { COHORT_LABELS } from "./counsel-types";

import type {
  CounselMessage,
  CounselMessageAuthor,
  CounselThread,
  CounselThreadStatus,
  CounselCohort,
} from "./counsel-types";

const DATA_DIR = path.join(process.cwd(), "data", "counsel");
const COLLECTION = "counsel";

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

async function writeThread(thread: CounselThread): Promise<void> {
  if (isRedisStore()) {
    await setDoc(COLLECTION, thread.id, thread);
    return;
  }
  await ensureDir();
  await fs.writeFile(
    path.join(DATA_DIR, `${thread.id}.json`),
    JSON.stringify(thread, null, 2),
    "utf8"
  );
}

/* ------------------------------------------------------------------ */
/*  createThread                                                       */
/* ------------------------------------------------------------------ */

export async function createThread(input: {
  firstMessage: string;
  cohort?: CounselCohort;
  claimCode: string;
}): Promise<CounselThread> {
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
  await writeThread(thread);
  return thread;
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

  if (isRedisStore()) {
    try {
      const records = await listDocs<CounselThread>(COLLECTION);
      return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (err) {
      console.error("[counsel-store] listThreads failed:", err);
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

export async function getThread(id: string): Promise<CounselThread | null> {
  noStore();

  if (isRedisStore()) {
    try {
      return await getDoc<CounselThread>(COLLECTION, id);
    } catch (err) {
      console.error("[counsel-store] getThread failed:", err);
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
  if (isRedisStore()) {
    try {
      return await deleteDoc(COLLECTION, id);
    } catch (err) {
      console.error("[counsel-store] deleteThread failed:", err);
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
