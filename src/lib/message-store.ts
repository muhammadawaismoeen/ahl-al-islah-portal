import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";

export type { MessageRole, AdvisorMessage } from "./message-types";
export { ROLE_LABELS } from "./message-types";
import type { AdvisorMessage } from "./message-types";

const DATA_DIR = path.join(process.cwd(), "data", "messages");
const BLOB_PREFIX = "messages/";

function isBlobStore(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

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
/*  updateMessage (mark read, add reply)                               */
/* ------------------------------------------------------------------ */

export async function updateMessage(
  id: string,
  patch: Partial<Pick<AdvisorMessage, "status" | "reply" | "repliedAt">>
): Promise<boolean> {
  const existing = await getMessage(id);
  if (!existing) return false;

  const updated: AdvisorMessage = { ...existing, ...patch };

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
/*  listMessages                                                       */
/* ------------------------------------------------------------------ */

export async function listMessages(): Promise<AdvisorMessage[]> {
  noStore();

  if (isBlobStore()) {
    try {
      const { list } = await import("@vercel/blob");
      const records: AdvisorMessage[] = [];
      let cursor: string | undefined;

      do {
        const result = await list({
          prefix: BLOB_PREFIX,
          ...(cursor ? { cursor } : {}),
        });
        const fetches = result.blobs.map(async (blob) => {
          try {
            const res = await fetch(blob.url, { cache: "no-store" });
            return (await res.json()) as AdvisorMessage;
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

  if (isBlobStore()) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({
        prefix: `${BLOB_PREFIX}${id}.json`,
        limit: 1,
      });
      if (blobs.length === 0) return null;
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      return (await res.json()) as AdvisorMessage;
    } catch {
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
