import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_noStore as noStore, unstable_cache, revalidateTag } from "next/cache";
import {
  isRedisStore,
  setDoc,
  getDoc,
  listDocs,
  deleteDoc,
  ensureCounter,
  setCounter,
  decrCounter,
  incrCounter,
} from "./redis";

export type {
  Drive,
  DriveStatus,
  DriveItem,
  DriveApplication,
  ApplicationStatus,
  Donation,
  DonationStatus,
  DriveStats,
  Ambassador,
  AmbassadorStatus,
} from "./drive-types";

import type {
  Drive,
  DriveItem,
  DriveApplication,
  ApplicationStatus,
  Donation,
  DriveStats,
  Ambassador,
} from "./drive-types";
import { getDriveSettings, computeSuggestedTarget } from "./drive-settings";
import { isCollegeEmail } from "./drive-config";

const DATA_ROOT = path.join(process.cwd(), "data", "drive");
const DIR = {
  drives: path.join(DATA_ROOT, "drives"),
  items: path.join(DATA_ROOT, "items"),
  applications: path.join(DATA_ROOT, "applications"),
  donations: path.join(DATA_ROOT, "donations"),
  ambassadors: path.join(DATA_ROOT, "ambassadors"),
};
const COLLECTION = {
  drives: "drive-drives",
  items: "drive-items",
  applications: "drive-applications",
  donations: "drive-donations",
  ambassadors: "drive-ambassadors",
};
const DRIVES_TAG = "drive-drives";
const ITEMS_TAG = "drive-items";
const STATS_TAG = "drive-stats";

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

async function listRecordsRaw<T>(collection: string, dir: string): Promise<T[]> {
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

async function getRecordRaw<T>(
  collection: string,
  dir: string,
  id: string
): Promise<T | null> {
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

async function deleteRecord(collection: string, dir: string, id: string): Promise<boolean> {
  if (isRedisStore()) {
    try {
      return await deleteDoc(collection, id);
    } catch (err) {
      console.error(`[drive-store] deleteRecord(${collection}) failed:`, err);
      return false;
    }
  }

  try {
    await fs.unlink(path.join(dir, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}

/** For collections that stay uncached (applications/donations/ambassadors) —
 *  always read fresh, same as before. */
async function listRecords<T>(collection: string, dir: string): Promise<T[]> {
  noStore();
  return listRecordsRaw<T>(collection, dir);
}

async function getRecord<T>(
  collection: string,
  dir: string,
  id: string
): Promise<T | null> {
  noStore();
  return getRecordRaw<T>(collection, dir, id);
}

/* Drives and catalog items are read far more often than they're written
 * (public landing/donate/apply pages vs. admin-only edits), so their reads
 * go through the Next Data Cache and get invalidated explicitly on write. */
const getCachedDrives = unstable_cache(
  () => listRecordsRaw<Drive>(COLLECTION.drives, DIR.drives),
  ["drive-drives-list"],
  { tags: [DRIVES_TAG], revalidate: false }
);

const getCachedDrive = unstable_cache(
  (id: string) => getRecordRaw<Drive>(COLLECTION.drives, DIR.drives, id),
  ["drive-drive-doc"],
  { tags: [DRIVES_TAG], revalidate: false }
);

const getCachedItems = unstable_cache(
  () => listRecordsRaw<DriveItem>(COLLECTION.items, DIR.items),
  ["drive-items-list"],
  { tags: [ITEMS_TAG], revalidate: false }
);

const getCachedItem = unstable_cache(
  (id: string) => getRecordRaw<DriveItem>(COLLECTION.items, DIR.items, id),
  ["drive-item-doc"],
  { tags: [ITEMS_TAG], revalidate: false }
);

/* ------------------------------------------------------------------ */
/*  Drives                                                              */
/* ------------------------------------------------------------------ */

/** Records written before `applicationsOpen` existed default to open, so
 *  applications don't silently close for drives created pre-migration. */
function withDriveDefaults(drive: Drive): Drive {
  return { ...drive, applicationsOpen: drive.applicationsOpen ?? true };
}

export async function listDrives(): Promise<Drive[]> {
  const drives = await getCachedDrives();
  return drives
    .map(withDriveDefaults)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDrive(id: string): Promise<Drive | null> {
  const drive = await getCachedDrive(id);
  return drive ? withDriveDefaults(drive) : null;
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
    applicationsOpen: true,
    createdAt: now,
    updatedAt: now,
  };
  await writeRecord(COLLECTION.drives, DIR.drives, drive);
  revalidateTag(DRIVES_TAG);
  revalidateTag(STATS_TAG);
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
      | "applicationsOpen"
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
  revalidateTag(DRIVES_TAG);
  return updated;
}

/** Deletes the drive and its catalog items (its applications/donations/
 *  ambassadors are left in place as historical records — every read of
 *  those already tolerates a missing drive, e.g. driveNameById fallbacks). */
export async function deleteDrive(id: string): Promise<boolean> {
  const items = await listDriveItems(id);
  await Promise.all(items.map((item) => deleteRecord(COLLECTION.items, DIR.items, item.id)));
  const ok = await deleteRecord(COLLECTION.drives, DIR.drives, id);
  revalidateTag(DRIVES_TAG);
  revalidateTag(ITEMS_TAG);
  revalidateTag(STATS_TAG);
  return ok;
}

/* ------------------------------------------------------------------ */
/*  Drive catalog items                                                */
/* ------------------------------------------------------------------ */

export async function listDriveItems(driveId?: string): Promise<DriveItem[]> {
  const items = await getCachedItems();
  const scoped = driveId ? items.filter((i) => i.driveId === driveId) : items;
  return scoped.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getDriveItem(id: string): Promise<DriveItem | null> {
  return getCachedItem(id);
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
  if (isRedisStore()) {
    await setCounter(COLLECTION.items, item.id, item.totalStock);
  }
  revalidateTag(ITEMS_TAG);
  return item;
}

/** Admin-only stock edit — an authoritative override, so it force-sets the
 *  atomic reservation counter rather than going through reserveBook's
 *  decrement path. */
export async function updateDriveItemStock(
  id: string,
  patch: Partial<Pick<DriveItem, "totalStock" | "remainingStock" | "perStudentLimit" | "name">>
): Promise<DriveItem | null> {
  const item = await getDriveItem(id);
  if (!item) return null;
  const updated: DriveItem = { ...item, ...patch };
  await writeRecord(COLLECTION.items, DIR.items, updated);
  if (isRedisStore() && patch.remainingStock !== undefined) {
    await setCounter(COLLECTION.items, id, updated.remainingStock);
  }
  revalidateTag(ITEMS_TAG);
  return updated;
}

export async function deleteDriveItem(id: string): Promise<boolean> {
  const ok = await deleteRecord(COLLECTION.items, DIR.items, id);
  revalidateTag(ITEMS_TAG);
  return ok;
}

/* ------------------------------------------------------------------ */
/*  Applications                                                        */
/* ------------------------------------------------------------------ */

/** Records written before `requestedItemId` existed default it to the
 *  current itemId, so they read as "not changed since request" rather than
 *  crashing on a missing field. */
function withApplicationDefaults(app: DriveApplication): DriveApplication {
  return { ...app, requestedItemId: app.requestedItemId ?? app.itemId };
}

export async function listApplications(
  driveId?: string
): Promise<DriveApplication[]> {
  const apps = await listRecords<DriveApplication>(
    COLLECTION.applications,
    DIR.applications
  );
  const scoped = driveId ? apps.filter((a) => a.driveId === driveId) : apps;
  return scoped
    .map(withApplicationDefaults)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listApplicationsByEmail(
  email: string
): Promise<DriveApplication[]> {
  const normalized = email.trim().toLowerCase();
  const all = await listApplications();
  return all.filter((a) => a.applicantEmail?.toLowerCase() === normalized);
}

export async function getApplication(
  id: string
): Promise<DriveApplication | null> {
  const app = await getRecord<DriveApplication>(
    COLLECTION.applications,
    DIR.applications,
    id
  );
  return app ? withApplicationDefaults(app) : null;
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
  applicantEmail: string;
}): Promise<
  | { ok: true; application: DriveApplication }
  | { ok: false; error: string }
> {
  if (!isCollegeEmail(input.applicantEmail)) {
    return {
      ok: false,
      error:
        "Book applications are only open to Akhtar Saeed Medical and Dental College student accounts.",
    };
  }

  const drive = await getDrive(input.driveId);
  if (!drive || !drive.applicationsOpen) {
    return { ok: false, error: "Applications aren't open for this drive right now." };
  }

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

  // Atomic decrement so two concurrent applicants can't both read the same
  // pre-decrement stock count and both win the last copy (see redis.ts).
  // Filesystem dev fallback has no concurrent writers, so a plain read is fine.
  let hasStock: boolean;
  let remainingAfter = item.remainingStock;
  if (isRedisStore()) {
    await ensureCounter(COLLECTION.items, item.id, item.remainingStock);
    const decremented = await decrCounter(COLLECTION.items, item.id);
    hasStock = decremented >= 0;
    if (hasStock) {
      remainingAfter = decremented;
    } else {
      await incrCounter(COLLECTION.items, item.id); // undo — no stock consumed
    }
  } else {
    hasStock = item.remainingStock > 0;
    if (hasStock) remainingAfter = item.remainingStock - 1;
  }

  const application: DriveApplication = {
    id: genId("dap"),
    driveId: input.driveId,
    itemId: input.itemId,
    requestedItemId: input.itemId,
    applicantName: input.applicantName,
    applicantContact: input.applicantContact,
    applicantEmail: input.applicantEmail,
    status: hasStock ? "pending-review" : "waitlisted",
    pickupCode: genCode("BK"),
    createdAt: now,
    updatedAt: now,
  };

  if (hasStock) {
    // Direct write, not updateDriveItemStock — that would force-set the
    // counter and could clobber a concurrent decrement that landed after ours.
    await writeRecord(COLLECTION.items, DIR.items, {
      ...item,
      remainingStock: remainingAfter,
    });
    revalidateTag(ITEMS_TAG);
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
  revalidateTag(STATS_TAG);
  return { ok: true, application: updated };
}

/**
 * Advisor manually confirms a pending-review applicant. Waitlisted
 * applications aren't confirmable here — they only clear once stock frees
 * up and a fresh request finds it available (see reserveBook).
 *
 * `itemId`, if given and different from the applicant's current item, lets
 * the Advisor swap in a different catalog item at confirm time (students
 * sometimes pick the wrong item, or it needs to change for logistics
 * reasons). The original request (requestedItemId) is left untouched for
 * the audit trail. Swapping releases the stock unit reserved for the
 * original item and attempts to reserve one on the new item — if the new
 * item is out of stock, the applicant is waitlisted on it instead, same as
 * the original request-time flow.
 */
export async function confirmApplication(
  id: string,
  itemId?: string
): Promise<
  | { ok: true; application: DriveApplication }
  | { ok: false; error: string }
> {
  const application = await getApplication(id);
  if (!application) return { ok: false, error: "Application not found." };
  if (application.status !== "pending-review") {
    return { ok: false, error: "Only pending-review applications can be confirmed." };
  }

  const targetItemId = itemId ?? application.itemId;
  const now = new Date().toISOString();

  if (targetItemId === application.itemId) {
    const updated: DriveApplication = {
      ...application,
      status: "confirmed",
      updatedAt: now,
    };
    await writeRecord(COLLECTION.applications, DIR.applications, updated);
    return { ok: true, application: updated };
  }

  const targetItem = await getDriveItem(targetItemId);
  if (!targetItem || targetItem.driveId !== application.driveId) {
    return { ok: false, error: "That catalog item no longer exists." };
  }

  // The original item's stock was decremented when this application was
  // created as pending-review — release it back since a different item is
  // being confirmed instead.
  const originalItem = await getDriveItem(application.itemId);
  if (originalItem) {
    if (isRedisStore()) {
      await incrCounter(COLLECTION.items, originalItem.id);
    }
    await writeRecord(COLLECTION.items, DIR.items, {
      ...originalItem,
      remainingStock: originalItem.remainingStock + 1,
    });
  }

  // Same atomic-decrement pattern as reserveBook — attempt to reserve a
  // unit of the new item.
  let hasStock: boolean;
  let remainingAfter = targetItem.remainingStock;
  if (isRedisStore()) {
    await ensureCounter(COLLECTION.items, targetItem.id, targetItem.remainingStock);
    const decremented = await decrCounter(COLLECTION.items, targetItem.id);
    hasStock = decremented >= 0;
    if (hasStock) {
      remainingAfter = decremented;
    } else {
      await incrCounter(COLLECTION.items, targetItem.id);
    }
  } else {
    hasStock = targetItem.remainingStock > 0;
    if (hasStock) remainingAfter = targetItem.remainingStock - 1;
  }

  if (hasStock) {
    await writeRecord(COLLECTION.items, DIR.items, {
      ...targetItem,
      remainingStock: remainingAfter,
    });
  }
  revalidateTag(ITEMS_TAG);

  const updated: DriveApplication = {
    ...application,
    itemId: targetItemId,
    status: hasStock ? "confirmed" : "waitlisted",
    updatedAt: now,
  };
  await writeRecord(COLLECTION.applications, DIR.applications, updated);
  return { ok: true, application: updated };
}

/* ------------------------------------------------------------------ */
/*  Donations                                                           */
/* ------------------------------------------------------------------ */

/** Records written before `donorSubmittedAmount` existed default it to the
 *  current amount, so they read as "not corrected since submission" rather
 *  than crashing on a missing field. */
function withDonationDefaults(donation: Donation): Donation {
  return {
    ...donation,
    donorSubmittedAmount: donation.donorSubmittedAmount ?? donation.amount,
  };
}

export async function listDonations(driveId?: string): Promise<Donation[]> {
  const donations = await listRecords<Donation>(
    COLLECTION.donations,
    DIR.donations
  );
  const scoped =
    driveId === undefined
      ? donations
      : donations.filter((d) => d.driveId === driveId);
  return scoped
    .map(withDonationDefaults)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDonation(id: string): Promise<Donation | null> {
  const donation = await getRecord<Donation>(
    COLLECTION.donations,
    DIR.donations,
    id
  );
  return donation ? withDonationDefaults(donation) : null;
}

export async function listDonationsByEmail(email: string): Promise<Donation[]> {
  const normalized = email.trim().toLowerCase();
  const all = await listDonations();
  return all.filter((d) => d.donorEmail?.toLowerCase() === normalized);
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
  donorEmail: string;
  amount: number;
  proofUrl: string;
  ambassadorId?: string | null;
}): Promise<Donation> {
  const donation: Donation = {
    id: genId("dnt"),
    driveId: input.driveId,
    donorName: input.donorName,
    donorContact: input.donorContact,
    donorEmail: input.donorEmail,
    amount: input.amount,
    donorSubmittedAmount: input.amount,
    proofUrl: input.proofUrl,
    status: "pending",
    refCode: genCode("DN"),
    ambassadorId: input.ambassadorId ?? null,
    createdAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.donations, DIR.donations, donation);
  return donation;
}

/**
 * Advisor reviews a pending donation. `correctedAmount`, if given and
 * different from what the donor submitted, lets the Advisor record the
 * verified figure they actually confirmed against the payment proof —
 * donorSubmittedAmount is left untouched for the audit trail, and only the
 * (possibly corrected) `amount` rolls up into raised totals.
 */
export async function reviewDonation(
  id: string,
  decision: "verified" | "rejected",
  reviewedBy: string,
  correctedAmount?: number
): Promise<{ ok: true; donation: Donation } | { ok: false; error: string }> {
  const donation = await getDonation(id);
  if (!donation) return { ok: false, error: "Donation not found." };
  if (donation.status !== "pending") {
    return { ok: false, error: "This donation has already been reviewed." };
  }
  if (
    correctedAmount !== undefined &&
    (!Number.isFinite(correctedAmount) || correctedAmount <= 0)
  ) {
    return { ok: false, error: "Please enter a valid amount." };
  }

  const updated: Donation = {
    ...donation,
    amount:
      decision === "verified" && correctedAmount !== undefined
        ? correctedAmount
        : donation.amount,
    status: decision,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.donations, DIR.donations, updated);

  if (decision === "verified") {
    await Promise.all([
      donation.driveId ? recomputeDriveRaised(donation.driveId) : Promise.resolve(),
      donation.ambassadorId ? recomputeAmbassadorRaised(donation.ambassadorId) : Promise.resolve(),
    ]);
    revalidateTag(STATS_TAG);
  }

  return { ok: true, donation: updated };
}

export async function deleteDonation(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const donation = await getDonation(id);
  if (!donation) return { ok: false, error: "Donation not found." };

  await deleteRecord(COLLECTION.donations, DIR.donations, id);

  if (donation.status === "verified") {
    await Promise.all([
      donation.driveId ? recomputeDriveRaised(donation.driveId) : Promise.resolve(),
      donation.ambassadorId ? recomputeAmbassadorRaised(donation.ambassadorId) : Promise.resolve(),
    ]);
    revalidateTag(STATS_TAG);
  }

  return { ok: true };
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
  revalidateTag(DRIVES_TAG);
}

/* ------------------------------------------------------------------ */
/*  Drive Ambassadors                                                   */
/* ------------------------------------------------------------------ */

export async function listAmbassadors(driveId?: string): Promise<Ambassador[]> {
  const all = await listRecords<Ambassador>(COLLECTION.ambassadors, DIR.ambassadors);
  const scoped = driveId ? all.filter((a) => a.driveId === driveId) : all;
  return scoped.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAmbassador(id: string): Promise<Ambassador | null> {
  return getRecord<Ambassador>(COLLECTION.ambassadors, DIR.ambassadors, id);
}

export async function listAmbassadorsByEmail(email: string): Promise<Ambassador[]> {
  const normalized = email.trim().toLowerCase();
  const all = await listAmbassadors();
  return all.filter((a) => a.email.toLowerCase() === normalized);
}

/**
 * Register a student as an Ambassador for a drive. Admin-approval is
 * required before the registration goes live (status starts "pending").
 */
export async function registerAmbassador(input: {
  driveId: string;
  name: string;
  email: string;
  contact: string;
  ownTarget: number;
  /** Which figure the ambassador picked as their real target — must equal
   *  either ownTarget or the computed suggestedTarget; anything else is
   *  rejected server-side rather than trusted from the client. */
  chosenTarget: number;
}): Promise<{ ok: true; ambassador: Ambassador } | { ok: false; error: string }> {
  if (input.contact.trim().length < 7) {
    return { ok: false, error: "Please enter a valid phone number." };
  }
  if (!Number.isFinite(input.ownTarget) || input.ownTarget <= 0) {
    return { ok: false, error: "Please enter a valid target amount." };
  }

  const existing = await listAmbassadors(input.driveId);
  const alreadyRegistered = existing.some(
    (a) => a.email.toLowerCase() === input.email.toLowerCase() && a.status !== "rejected"
  );
  if (alreadyRegistered) {
    return { ok: false, error: "You're already registered as an Ambassador for this drive." };
  }

  const settings = await getDriveSettings();
  const suggestedTarget = computeSuggestedTarget(input.ownTarget, settings.ihsanPercentage);
  const chosenTarget =
    input.chosenTarget === suggestedTarget ? suggestedTarget : input.ownTarget;
  const isIhsanLevel = chosenTarget === suggestedTarget;

  const now = new Date().toISOString();
  const ambassador: Ambassador = {
    id: genId("amb"),
    driveId: input.driveId,
    name: input.name,
    email: input.email,
    contact: input.contact,
    ownTarget: input.ownTarget,
    suggestedTarget,
    chosenTarget,
    isIhsanLevel,
    raisedAmount: 0,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  await writeRecord(COLLECTION.ambassadors, DIR.ambassadors, ambassador);
  return { ok: true, ambassador };
}

export async function reviewAmbassador(
  id: string,
  decision: "approved" | "rejected",
  reviewedBy: string
): Promise<{ ok: true; ambassador: Ambassador } | { ok: false; error: string }> {
  const ambassador = await getAmbassador(id);
  if (!ambassador) return { ok: false, error: "Ambassador registration not found." };
  if (ambassador.status !== "pending") {
    return { ok: false, error: "This registration has already been reviewed." };
  }

  const updated: Ambassador = {
    ...ambassador,
    status: decision,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.ambassadors, DIR.ambassadors, updated);
  return { ok: true, ambassador: updated };
}

export async function updateAmbassadorName(
  id: string,
  name: string
): Promise<{ ok: true; ambassador: Ambassador } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: "Please enter a valid name." };

  const ambassador = await getAmbassador(id);
  if (!ambassador) return { ok: false, error: "Ambassador registration not found." };

  const updated: Ambassador = {
    ...ambassador,
    name: trimmed,
    updatedAt: new Date().toISOString(),
  };
  await writeRecord(COLLECTION.ambassadors, DIR.ambassadors, updated);
  return { ok: true, ambassador: updated };
}

export async function deleteAmbassador(id: string): Promise<boolean> {
  return deleteRecord(COLLECTION.ambassadors, DIR.ambassadors, id);
}

/**
 * Records a donation the admin collected outside the public proof-upload
 * flow (cash-in-hand, bank transfer confirmed by phone, etc.) as already
 * verified, crediting an Ambassador's leaderboard total immediately.
 */
export async function recordManualDonation(input: {
  ambassadorId: string;
  amount: number;
  donorName?: string | null;
  note?: string | null;
  reviewedBy: string;
}): Promise<{ ok: true; donation: Donation } | { ok: false; error: string }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: "Please enter a valid amount." };
  }
  const ambassador = await getAmbassador(input.ambassadorId);
  if (!ambassador) return { ok: false, error: "Ambassador registration not found." };

  const now = new Date().toISOString();
  const donation: Donation = {
    id: genId("dnt"),
    driveId: ambassador.driveId,
    donorName: input.donorName ?? null,
    donorContact: input.note ?? null,
    amount: input.amount,
    donorSubmittedAmount: input.amount,
    proofUrl: "manual-entry",
    status: "verified",
    reviewedBy: input.reviewedBy,
    reviewedAt: now,
    refCode: genCode("DN"),
    ambassadorId: ambassador.id,
    createdAt: now,
  };
  await writeRecord(COLLECTION.donations, DIR.donations, donation);
  await Promise.all([
    recomputeDriveRaised(ambassador.driveId),
    recomputeAmbassadorRaised(ambassador.id),
  ]);
  revalidateTag(STATS_TAG);
  return { ok: true, donation };
}

/**
 * Records a general cash/in-hand donation an admin collected outside the
 * public proof-upload flow and not attributed to any ambassador — e.g. cash
 * handed over at the office. Saved as already verified, same as
 * recordManualDonation, but credits the drive's (or general fund's) raised
 * total directly instead of an ambassador leaderboard.
 */
export async function recordCashDonation(input: {
  driveId: string | null;
  amount: number;
  donorName?: string | null;
  note?: string | null;
  reviewedBy: string;
}): Promise<{ ok: true; donation: Donation } | { ok: false; error: string }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: "Please enter a valid amount." };
  }

  const now = new Date().toISOString();
  const donation: Donation = {
    id: genId("dnt"),
    driveId: input.driveId,
    donorName: input.donorName ?? null,
    donorContact: input.note ?? null,
    amount: input.amount,
    donorSubmittedAmount: input.amount,
    proofUrl: "manual-entry",
    status: "verified",
    reviewedBy: input.reviewedBy,
    reviewedAt: now,
    refCode: genCode("DN"),
    ambassadorId: null,
    createdAt: now,
  };
  await writeRecord(COLLECTION.donations, DIR.donations, donation);
  if (input.driveId) {
    await recomputeDriveRaised(input.driveId);
  }
  revalidateTag(STATS_TAG);
  return { ok: true, donation };
}

async function recomputeAmbassadorRaised(ambassadorId: string): Promise<void> {
  const ambassador = await getAmbassador(ambassadorId);
  if (!ambassador) return;
  const donations = await listDonations(ambassador.driveId);
  const raised = donations
    .filter((d) => d.ambassadorId === ambassadorId && d.status === "verified")
    .reduce((sum, d) => sum + d.amount, 0);

  const updated: Ambassador = {
    ...ambassador,
    raisedAmount: raised,
    updatedAt: new Date().toISOString(),
  };
  if (raised >= ambassador.chosenTarget && !ambassador.certificateIssuedAt) {
    updated.certificateIssuedAt = new Date().toISOString();
  }
  await writeRecord(COLLECTION.ambassadors, DIR.ambassadors, updated);
}

/* ------------------------------------------------------------------ */
/*  Aggregate stats — public landing page stat chips                   */
/* ------------------------------------------------------------------ */

/** Public landing-page stat chips scan the entire applications/donations
 *  collections — cache the aggregate rather than the raw collections so
 *  admin queues (which read those uncached) stay live. */
const getCachedDriveStats = unstable_cache(
  async (): Promise<DriveStats> => {
    const [drives, applications, donations] = await Promise.all([
      listRecordsRaw<Drive>(COLLECTION.drives, DIR.drives),
      listRecordsRaw<DriveApplication>(COLLECTION.applications, DIR.applications),
      listRecordsRaw<Donation>(COLLECTION.donations, DIR.donations),
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
  },
  ["drive-stats"],
  { tags: [STATS_TAG], revalidate: false }
);

export async function computeDriveStats(): Promise<DriveStats> {
  return getCachedDriveStats();
}
