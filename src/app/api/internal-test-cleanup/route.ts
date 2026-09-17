import { NextResponse } from "next/server";
import {
  listDrives,
  listDriveItems,
  listApplications,
  listDonations,
} from "@/lib/drive-store";
import { deleteDoc } from "@/lib/redis";
import { deleteDonationProof } from "@/lib/donation-upload";

// TEMPORARY, ONE-OFF cleanup route — removes the "TEST — Claude E2E Seed"
// drive/item/application/donation created via /api/internal-test-seed.
// Delete this file (and internal-test-seed) after use. Never commit long-term.
const CLEANUP_TOKEN = "232dd7f146bdce7f6c127cd2cb722f2d67b7b0de63b883a8";

const TEST_DRIVE_NAME = "TEST — Claude E2E Seed (safe to delete)";

export async function POST(request: Request): Promise<NextResponse> {
  if (request.headers.get("x-cleanup-token") !== CLEANUP_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [drives, items, applications, donations] = await Promise.all([
    listDrives(),
    listDriveItems(),
    listApplications(),
    listDonations(),
  ]);

  const testDriveIds = new Set(
    drives.filter((d) => d.name === TEST_DRIVE_NAME).map((d) => d.id)
  );

  const testDonations = donations.filter(
    (d) => d.driveId !== null && testDriveIds.has(d.driveId)
  );
  const testApplications = applications.filter((a) => testDriveIds.has(a.driveId));
  const testItems = items.filter((i) => testDriveIds.has(i.driveId));

  const deleted = {
    donations: [] as string[],
    applications: [] as string[],
    items: [] as string[],
    drives: [] as string[],
  };

  for (const d of testDonations) {
    await deleteDonationProof(d.proofUrl);
    await deleteDoc("drive-donations", d.id);
    deleted.donations.push(d.id);
  }
  for (const a of testApplications) {
    await deleteDoc("drive-applications", a.id);
    deleted.applications.push(a.id);
  }
  for (const i of testItems) {
    await deleteDoc("drive-items", i.id);
    deleted.items.push(i.id);
  }
  for (const id of testDriveIds) {
    await deleteDoc("drive-drives", id);
    deleted.drives.push(id);
  }

  return NextResponse.json({ ok: true, deleted });
}
