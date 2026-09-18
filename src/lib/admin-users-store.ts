import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { isRedisStore, setDoc, listDocs, deleteDoc } from "./redis";
import type { AdminUser, AdminRole } from "./admin-types";

const DATA_DIR = path.join(process.cwd(), "data", "admin-users");
const COLLECTION = "admin-users";
const ADMIN_USERS_TAG = "admin-users";

function newId(): string {
  return `au-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readAllAdminUsers(): Promise<AdminUser[]> {
  if (isRedisStore()) {
    try {
      const records = await listDocs<AdminUser>(COLLECTION);
      return records.sort((a, b) => a.email.localeCompare(b.email));
    } catch (err) {
      console.error("[admin-users-store] list failed:", err);
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
          return JSON.parse(raw) as AdminUser;
        } catch {
          return null;
        }
      })
  );
  return records
    .filter((r): r is AdminUser => r !== null)
    .sort((a, b) => a.email.localeCompare(b.email));
}

const getCachedAdminUsers = unstable_cache(readAllAdminUsers, ["admin-users-list"], {
  tags: [ADMIN_USERS_TAG],
  revalidate: false,
});

export async function listAdminUsers(): Promise<AdminUser[]> {
  return getCachedAdminUsers();
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const normalized = email.trim().toLowerCase();
  const all = await listAdminUsers();
  return all.find((u) => u.email === normalized) ?? null;
}

async function writeAdminUser(record: AdminUser): Promise<void> {
  if (isRedisStore()) {
    await setDoc(COLLECTION, record.id, record);
  } else {
    await ensureDir();
    await fs.writeFile(
      path.join(DATA_DIR, `${record.id}.json`),
      JSON.stringify(record, null, 2),
      "utf8"
    );
  }
  revalidateTag(ADMIN_USERS_TAG);
}

export async function addAdminUser(input: {
  email: string;
  role: AdminRole;
  addedBy: string;
}): Promise<AdminUser> {
  const email = input.email.trim().toLowerCase();
  const existing = await getAdminUserByEmail(email);
  if (existing) {
    throw new Error("That email is already an admin user.");
  }
  const record: AdminUser = {
    id: newId(),
    email,
    role: input.role,
    addedBy: input.addedBy,
    createdAt: new Date().toISOString(),
  };
  await writeAdminUser(record);
  return record;
}

export async function updateAdminUserRole(
  id: string,
  role: AdminRole
): Promise<AdminUser | null> {
  const all = await listAdminUsers();
  const existing = all.find((u) => u.id === id);
  if (!existing) return null;
  const updated: AdminUser = { ...existing, role };
  await writeAdminUser(updated);
  return updated;
}

export async function removeAdminUser(id: string): Promise<boolean> {
  let ok: boolean;
  if (isRedisStore()) {
    try {
      ok = await deleteDoc(COLLECTION, id);
    } catch (err) {
      console.error("[admin-users-store] remove failed:", err);
      ok = false;
    }
  } else {
    try {
      await fs.unlink(path.join(DATA_DIR, `${id}.json`));
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (ok) revalidateTag(ADMIN_USERS_TAG);
  return ok;
}
