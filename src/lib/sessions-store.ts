import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import type { Session, Activity } from "./sessions-types";

export type { Session, Activity } from "./sessions-types";

const DATA_DIR = path.join(process.cwd(), "data", "sessions");
const BLOB_PREFIX = "sessions/";

function isBlobStore(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base || newId("s");
}

/* ------------------------------------------------------------------ */
/*  internal: write / read / delete one session                        */
/* ------------------------------------------------------------------ */

async function writeSession(record: Session): Promise<void> {
  const payload = JSON.stringify(record, null, 2);
  if (isBlobStore()) {
    const { put } = await import("@vercel/blob");
    await put(`${BLOB_PREFIX}${record.id}.json`, payload, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  } else {
    await ensureDir();
    await fs.writeFile(
      path.join(DATA_DIR, `${record.id}.json`),
      payload,
      "utf8"
    );
  }
}

/* ------------------------------------------------------------------ */
/*  listSessions                                                       */
/* ------------------------------------------------------------------ */

export async function listSessions(): Promise<Session[]> {
  noStore();

  if (isBlobStore()) {
    try {
      const { list } = await import("@vercel/blob");
      const records: Session[] = [];
      let cursor: string | undefined;

      do {
        const result = await list({
          prefix: BLOB_PREFIX,
          ...(cursor ? { cursor } : {}),
        });
        const fetches = result.blobs.map(async (blob) => {
          try {
            const res = await fetch(blob.url, { cache: "no-store" });
            return (await res.json()) as Session;
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

      return records.sort((a, b) => b.date.localeCompare(a.date));
    } catch {
      return [];
    }
  }

  await ensureDir();
  let files: string[] = [];
  try {
    files = await fs.readdir(DATA_DIR);
  } catch {
    return [];
  }
  const records = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => {
        try {
          const raw = await fs.readFile(path.join(DATA_DIR, f), "utf8");
          return JSON.parse(raw) as Session;
        } catch {
          return null;
        }
      })
  );
  return records
    .filter((r): r is Session => r !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ------------------------------------------------------------------ */
/*  getSession (by id)                                                 */
/* ------------------------------------------------------------------ */

export async function getSession(id: string): Promise<Session | null> {
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
      return (await res.json()) as Session;
    } catch {
      return null;
    }
  }

  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  getSessionBySlug                                                   */
/* ------------------------------------------------------------------ */

export async function getSessionBySlug(slug: string): Promise<Session | null> {
  const all = await listSessions();
  return all.find((s) => s.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/*  createSession                                                      */
/* ------------------------------------------------------------------ */

export async function createSession(
  input: Omit<Session, "id" | "slug" | "activities" | "createdAt" | "updatedAt"> & {
    slug?: string;
  }
): Promise<Session> {
  const now = new Date().toISOString();
  const id = newId("ses");
  const baseSlug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);
  // ensure uniqueness — if collision, append short id
  const existing = await listSessions();
  const slug = existing.some((s) => s.slug === baseSlug)
    ? `${baseSlug}-${id.slice(-6)}`
    : baseSlug;

  const record: Session = {
    id,
    slug,
    title: input.title,
    arabicTitle: input.arabicTitle,
    date: input.date,
    description: input.description,
    startTime: input.startTime,
    endTime: input.endTime,
    meetingLink: input.meetingLink,
    activities: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeSession(record);
  return record;
}

/* ------------------------------------------------------------------ */
/*  updateSession                                                      */
/* ------------------------------------------------------------------ */

export async function updateSession(
  id: string,
  patch: Partial<
    Pick<
      Session,
      | "title"
      | "arabicTitle"
      | "date"
      | "description"
      | "startTime"
      | "endTime"
      | "meetingLink"
    >
  >
): Promise<Session | null> {
  const existing = await getSession(id);
  if (!existing) return null;
  const updated: Session = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeSession(updated);
  return updated;
}

/* ------------------------------------------------------------------ */
/*  deleteSession                                                      */
/* ------------------------------------------------------------------ */

export async function deleteSession(id: string): Promise<boolean> {
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

/* ------------------------------------------------------------------ */
/*  addActivity                                                        */
/* ------------------------------------------------------------------ */

export async function addActivity(
  sessionId: string,
  input: Omit<Activity, "id" | "createdAt">
): Promise<Activity | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const activity: Activity = {
    id: newId("act"),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const updated: Session = {
    ...session,
    activities: [...session.activities, activity],
    updatedAt: new Date().toISOString(),
  };
  await writeSession(updated);
  return activity;
}

/* ------------------------------------------------------------------ */
/*  updateActivity                                                     */
/* ------------------------------------------------------------------ */

export async function updateActivity(
  sessionId: string,
  activityId: string,
  patch: Partial<Pick<Activity, "title" | "timeMarker" | "durationMin" | "body">>
): Promise<Activity | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const idx = session.activities.findIndex((a) => a.id === activityId);
  if (idx === -1) return null;

  const updated: Activity = { ...session.activities[idx], ...patch };
  const newActivities = [...session.activities];
  newActivities[idx] = updated;

  await writeSession({
    ...session,
    activities: newActivities,
    updatedAt: new Date().toISOString(),
  });
  return updated;
}

/* ------------------------------------------------------------------ */
/*  removeActivity                                                     */
/* ------------------------------------------------------------------ */

export async function removeActivity(
  sessionId: string,
  activityId: string
): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  const next = session.activities.filter((a) => a.id !== activityId);
  if (next.length === session.activities.length) return false;
  await writeSession({
    ...session,
    activities: next,
    updatedAt: new Date().toISOString(),
  });
  return true;
}

/* ------------------------------------------------------------------ */
/*  sortActivities — by timeMarker (parsed as H:MM or MM), then        */
/*  creation order                                                     */
/* ------------------------------------------------------------------ */

export function sortActivities(activities: Activity[]): Activity[] {
  const toMinutes = (m?: string): number => {
    if (!m) return Number.POSITIVE_INFINITY;
    const t = m.trim();
    const parts = t.split(":").map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return Number.POSITIVE_INFINITY;
    if (parts.length === 1) return parts[0];
    return parts[0] * 60 + (parts[1] ?? 0);
  };
  return [...activities].sort((a, b) => {
    const da = toMinutes(a.timeMarker);
    const db = toMinutes(b.timeMarker);
    if (da !== db) return da - db;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
