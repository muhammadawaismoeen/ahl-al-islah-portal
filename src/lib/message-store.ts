import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { isRedisStore, setDoc, getDoc, listDocs, deleteDoc } from "./redis";

export type { MessageRole, AdvisorMessage } from "./message-types";
export { ROLE_LABELS } from "./message-types";
import type { AdvisorMessage } from "./message-types";

const DATA_DIR = path.join(process.cwd(), "data", "messages");
const COLLECTION = "messages";

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ------------------------------------------------------------------ */
/*  saveMessage                                                        */
/* ------------------------------------------------------------------ */

export async function saveMessage(
  input: Omit<AdvisorMessage, "id" | "submittedAt" | "status">
): Promise<AdvisorMessage> {
  const id = `msg-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const record: AdvisorMessage = {
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
/*  updateMessage (mark read, add reply)                               */
/* ------------------------------------------------------------------ */

export async function updateMessage(
  id: string,
  patch: Partial<Pick<AdvisorMessage, "status" | "reply" | "repliedAt">>
): Promise<boolean> {
  const existing = await getMessage(id);
  if (!existing) return false;

  const updated: AdvisorMessage = { ...existing, ...patch };

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
/*  listMessages                                                       */
/* ------------------------------------------------------------------ */

export async function listMessages(): Promise<AdvisorMessage[]> {
  noStore();

  if (isRedisStore()) {
    try {
      const records = await listDocs<AdvisorMessage>(COLLECTION);
      return records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    } catch (err) {
      console.error("[message-store] listMessages failed:", err);
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
          return JSON.parse(raw) as AdvisorMessage;
        } catch {
          return null;
        }
      })
  );
  return records
    .filter((r): r is AdvisorMessage => r !== null)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/* ------------------------------------------------------------------ */
/*  getMessage                                                         */
/* ------------------------------------------------------------------ */

export async function getMessage(id: string): Promise<AdvisorMessage | null> {
  noStore();

  if (isRedisStore()) {
    try {
      return await getDoc<AdvisorMessage>(COLLECTION, id);
    } catch (err) {
      console.error("[message-store] getMessage failed:", err);
      return null;
    }
  }

  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as AdvisorMessage;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  deleteMessage                                                      */
/* ------------------------------------------------------------------ */

export async function deleteMessage(id: string): Promise<boolean> {
  if (isRedisStore()) {
    try {
      return await deleteDoc(COLLECTION, id);
    } catch (err) {
      console.error("[message-store] deleteMessage failed:", err);
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
