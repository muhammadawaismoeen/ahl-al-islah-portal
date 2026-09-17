import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { isRedisStore, setDoc, getDoc, listDocs } from "./redis";

export type {
  Drive,
  DriveStatus,
  DriveItem,
  DriveApplication,
  ApplicationStatus,
  Donation,
  DonationStatus,
  DriveStats,
} from "./drive-types";

import type {
  Drive,
  DriveItem,
  DriveApplication,
  ApplicationStatus,
  Donation,
  DriveStats,
} from "./drive-types";

const DATA_ROOT = path.join(process.cwd(), "data", "drive");
const DIR = {
  drives: path.join(DATA_ROOT, "drives"),
  items: path.join(DATA_ROOT, "items"),
  applications: path.join(DATA_ROOT, "applications"),
  donations: path.join(DATA_ROOT, "donations"),
};
const COLLECTION = {
  drives: "drive-drives",
  items: "drive-items",
  applications: "drive-applications",
  donations: "drive-donations",
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

/** Ticket-style code shown on QR tickets and reference chips — a lookup
 *  key, not a secret, so it's generated and stored in plaintext. */
function genCode(prefix: string): string {
  const hex = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `${prefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/* ------------------------------------------------------------------ */
/*  Generic per-collection read/write helpers                          */
/* ------------------------------------------------------------------ */

async function writeRecord<T extends { id: string }>(
  collection: string,
  dir: string,
  record: T
): Promise<void> {
  if (isRedisStore()) {
    await setDoc(collection, record.id, record);
    return;
  }
  await ensureDir(dir);
  await fs.writeFile(
    path.join(dir, `${record.id}.json`),
    JSON.stringify(record, null, 2),
    "utf8"
  );
}

async function listRecords<T>(collection: string, dir: string): Promise<T[]> {
  noStore();

  if (isRedisStore()) {
    try {
      return await listDocs<T>(collection);
    } catch (err) {
      console.error(`[drive-store] listRecords(${collection}) failed:`, err);
      return [];
    }
  }

  await ensureDir(dir);
  const files = await fs.readdir(dir);
  const records = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f): Promise<T | null> => {
        try {
          const raw = await fs.readFile(path.join(dir, f), "utf8");
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      })
  );
  return records.filter((r) => r !== null) as T[];
}

async function getRecord<T>(
  collection: string,
  dir: string,
  id: string
): Promise<T | null> {
  noStore();

  if (isRedisStore()) {
    try {
      return await getDoc<T>(collection, id);
    } catch (err) {
      console.error(`[drive-store] getRecord(${collection}) failed:`, err);
      return null;
    }
  }

  await ensureDir(dir);
  try {
    const raw = await fs.readFile(path.join(dir, `${id}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Drives                                                              */
/* ------------------------------------------------------------------ */

export async function listDrives(): Promise<Drive[]> {
  const drives = await listRecords<Drive>(COLLECTION.drives, DIR.drives);
  return drives.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDrive(id: string): Promise<Drive | null> {
  return getRecord<Drive>(COLLECTION.drives, DIR.drives, id);
}

/** Most recently created open drive — the one the public landing page and
 *  apply/donate flows target when a specific drive isn't named. */
export async function getActiveDrive(): Promise<Drive | null> {
  const drives = await listDrives();
  return drives.find((d) => d.status === "open") ?? null;
}

export async function createDrive(input: {
  name: string;
  startDate: string;
  endDate: string;
  goalAmount: number;
  pickupLocation: string;
  pickupNote?: string;
}): Promise<Drive> {
  const now = new Date().toISOString();
  const drive: Drive = {
    id: genId("drv"),
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "open",
    goalAmount: input.goalAmount,
    raisedAmount: 0,
    pickupLocation: input.pickupLocation,
    pickupNote: input.pickupNote,
    createdAt: now,
    updatedAt: now,
  };
  await writeRecord(COLLECTION.drives, DIR.drives, drive);
  return drive;
}

export async function updateDrive(
  id: string,
  patch: Partial<
    Pick<
      Drive,
      | "name"
      | "startDate"
      | "endDate"
      | "status"
      | "goalAmount"
      | "pickupLocation"
      | "pickupNote"
    >
  >
): Promise<Drive | null> {
  const drive = await getDrive(id);
  if (!drive) return null;
  const updated: Drive = {
    ...drive,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.drives, DIR.drives, updated);
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Drive catalog items                                                */
/* ------------------------------------------------------------------ */

export async function listDriveItems(driveId?: string): Promise<DriveItem[]> {
  const items = await listRecords<DriveItem>(COLLECTION.items, DIR.items);
  const scoped = driveId ? items.filter((i) => i.driveId === driveId) : items;
  return scoped.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getDriveItem(id: string): Promise<DriveItem | null> {
  return getRecord<DriveItem>(COLLECTION.items, DIR.items, id);
}

export async function createDriveItem(input: {
  driveId: string;
  name: string;
  totalStock: number;
  perStudentLimit: number;
}): Promise<DriveItem> {
  const item: DriveItem = {
    id: genId("dit"),
    driveId: input.driveId,
    name: input.name,
    totalStock: input.totalStock,
    remainingStock: input.totalStock,
    perStudentLimit: input.perStudentLimit,
    createdAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.items, DIR.items, item);
  return item;
}

export async function updateDriveItemStock(
  id: string,
  patch: Partial<Pick<DriveItem, "totalStock" | "remainingStock" | "perStudentLimit" | "name">>
): Promise<DriveItem | null> {
  const item = await getDriveItem(id);
  if (!item) return null;
  const updated: DriveItem = { ...item, ...patch };
  await writeRecord(COLLECTION.items, DIR.items, updated);
  return updated;
}

/* ------------------------------------------------------------------ */
/*  Applications                                                        */
/* ------------------------------------------------------------------ */

export async function listApplications(
  driveId?: string
): Promise<DriveApplication[]> {
  const apps = await listRecords<DriveApplication>(
    COLLECTION.applications,
    DIR.applications
  );
  const scoped = driveId ? apps.filter((a) => a.driveId === driveId) : apps;
  return scoped.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApplication(
  id: string
): Promise<DriveApplication | null> {
  return getRecord<DriveApplication>(
    COLLECTION.applications,
    DIR.applications,
    id
  );
}

export async function findApplicationByPickupCode(
  code: string
): Promise<DriveApplication | null> {
  const normalized = code.trim().toUpperCase();
  const all = await listApplications();
  return all.find((a) => a.pickupCode === normalized) ?? null;
}

function normalizeContact(contact: string): string {
  return contact.trim().toLowerCase();
}

/**
 * Reserve a copy of a catalog item for an applicant. Enforces, server-side:
 *  - the item's per-student limit (by normalized contact, the closest proxy
 *    to "student identity" available without an account system)
 *  - one active application per item per applicant
 * Returns the created application: pending-review (awaiting Advisor
 * confirmation) if stock is available, waitlisted otherwise — decrementing
 * remaining stock in the pending-review case so it isn't double-reserved.
 */
export async function reserveBook(input: {
  driveId: string;
  itemId: string;
  applicantName: string;
  applicantContact: string;
}): Promise<
  | { ok: true; application: DriveApplication }
  | { ok: false; error: string }
> {
  const item = await getDriveItem(input.itemId);
  if (!item || item.driveId !== input.driveId) {
    return { ok: false, error: "That catalog item no longer exists." };
  }

  const contact = normalizeContact(input.applicantContact);
  const existing = await listApplications(input.driveId);

  const existingForItem = existing.filter(
    (a) =>
      a.itemId === input.itemId &&
      normalizeContact(a.applicantContact) === contact
  );
  if (existingForItem.length > 0) {
    return {
      ok: false,
      error: "You already have an application for this item.",
    };
  }

  const totalForContact = existing.filter(
    (a) => normalizeContact(a.applicantContact) === contact
  ).length;
  if (totalForContact >= item.perStudentLimit) {
    return {
      ok: false,
      error: `You've reached the limit of ${item.perStudentLimit} item(s) per student for this drive.`,
    };
  }

  const now = new Date().toISOString();
  const hasStock = item.remainingStock > 0;
  const application: DriveApplication = {
    id: genId("dap"),
    driveId: input.driveId,
    itemId: input.itemId,
    applicantName: input.applicantName,
    applicantContact: input.applicantContact,
    status: hasStock ? "pending-review" : "waitlisted",
    pickupCode: genCode("BK"),
    createdAt: now,
    updatedAt: now,
  };

  if (hasStock) {
    await updateDriveItemStock(item.id, {
      remainingStock: item.remainingStock - 1,
    });
  }

  await writeRecord(COLLECTION.applications, DIR.applications, application);
  return { ok: true, application };
}

export async function checkInApplication(
  code: string
): Promise<
  | { ok: true; application: DriveApplication }
  | { ok: false; error: string }
> {
  const application = await findApplicationByPickupCode(code);
  if (!application) {
    return { ok: false, error: "No application matches that pickup code." };
  }
  if (application.status === "picked-up") {
    return { ok: false, error: "This item has already been picked up." };
  }
  if (application.status !== "confirmed") {
    return {
      ok: false,
      error:
        application.status === "waitlisted"
          ? "This application is still waitlisted — confirm stock before check-in."
          : "This application is still pending review — confirm it before check-in.",
    };
  }

  const updated: DriveApplication = {
    ...application,
    status: "picked-up" as ApplicationStatus,
    pickedUpAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.applications, DIR.applications, updated);
  return { ok: true, application: updated };
}

/** Advisor manually confirms a pending-review applicant. Waitlisted
 *  applications aren't confirmable here — they only clear once stock frees
 *  up and a fresh request finds it available (see reserveBook). */
export async function confirmApplication(
  id: string
): Promise<
  | { ok: true; application: DriveApplication }
  | { ok: false; error: string }
> {
  const application = await getApplication(id);
  if (!application) return { ok: false, error: "Application not found." };
  if (application.status !== "pending-review") {
    return { ok: false, error: "Only pending-review applications can be confirmed." };
  }

  const updated: DriveApplication = {
    ...application,
    status: "confirmed",
    updatedAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.applications, DIR.applications, updated);
  return { ok: true, application: updated };
}

/* ------------------------------------------------------------------ */
/*  Donations                                                           */
/* ------------------------------------------------------------------ */

export async function listDonations(driveId?: string): Promise<Donation[]> {
  const donations = await listRecords<Donation>(
    COLLECTION.donations,
    DIR.donations
  );
  const scoped =
    driveId === undefined
      ? donations
      : donations.filter((d) => d.driveId === driveId);
  return scoped.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDonation(id: string): Promise<Donation | null> {
  return getRecord<Donation>(COLLECTION.donations, DIR.donations, id);
}

export async function findDonationByRefCode(
  code: string
): Promise<Donation | null> {
  const normalized = code.trim().toUpperCase();
  const all = await listDonations();
  return all.find((d) => d.refCode === normalized) ?? null;
}

export async function createDonation(input: {
  driveId: string | null;
  donorName: string | null;
  donorContact: string | null;
  amount: number;
  proofUrl: string;
}): Promise<Donation> {
  const donation: Donation = {
    id: genId("dnt"),
    driveId: input.driveId,
    donorName: input.donorName,
    donorContact: input.donorContact,
    amount: input.amount,
    proofUrl: input.proofUrl,
    status: "pending",
    refCode: genCode("DN"),
    createdAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.donations, DIR.donations, donation);
  return donation;
}

export async function reviewDonation(
  id: string,
  decision: "verified" | "rejected",
  reviewedBy: string
): Promise<{ ok: true; donation: Donation } | { ok: false; error: string }> {
  const donation = await getDonation(id);
  if (!donation) return { ok: false, error: "Donation not found." };
  if (donation.status !== "pending") {
    return { ok: false, error: "This donation has already been reviewed." };
  }

  const updated: Donation = {
    ...donation,
    status: decision,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.donations, DIR.donations, updated);

  if (decision === "verified" && donation.driveId) {
    await recomputeDriveRaised(donation.driveId);
  }

  return { ok: true, donation: updated };
}

async function recomputeDriveRaised(driveId: string): Promise<void> {
  const [drive, donations] = await Promise.all([
    getDrive(driveId),
    listDonations(driveId),
  ]);
  if (!drive) return;
  const raised = donations
    .filter((d) => d.status === "verified")
    .reduce((sum, d) => sum + d.amount, 0);
  await writeRecord(COLLECTION.drives, DIR.drives, {
    ...drive,
    raisedAmount: raised,
    updatedAt: new Date().toISOString(),
  });
}

/* ------------------------------------------------------------------ */
/*  Aggregate stats — public landing page stat chips                   */
/* ------------------------------------------------------------------ */

export async function computeDriveStats(): Promise<DriveStats> {
  const [drives, applications, donations] = await Promise.all([
    listDrives(),
    listApplications(),
    listDonations(),
  ]);

  const booksGivenAllTime = applications.filter(
    (a) => a.status === "picked-up"
  ).length;
  const generalFundTotal = donations
    .filter((d) => d.status === "verified" && d.driveId === null)
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    booksGivenAllTime,
    drivesRun: drives.length,
    generalFundTotal,
  };
}
