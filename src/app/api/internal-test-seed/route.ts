import { NextResponse } from "next/server";
import {
  createDrive,
  createDriveItem,
  reserveBook,
  createDonation,
} from "@/lib/drive-store";
import { uploadDonationProof } from "@/lib/donation-upload";

// TEMPORARY, ONE-OFF seed route for manual verification. Not part of the
// app — delete this file after use. Never commit it long-term.
const SEED_TOKEN = "b78f1e4a9c02d6f735a1e8c4079bde36f0a1c5e7d9b3f082";

function tinyPngFile(): File {
  // 1x1 red PNG, valid file bytes so uploadDonationProof's image/* check passes.
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const bytes = Buffer.from(base64, "base64");
  return new File([bytes], "test-receipt.png", { type: "image/png" });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (request.headers.get("x-seed-token") !== SEED_TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const now = new Date();
  const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const drive = await createDrive({
    name: "TEST — Claude E2E Seed (safe to delete)",
    startDate: now.toISOString().slice(0, 10),
    endDate: in30d.toISOString().slice(0, 10),
    goalAmount: 1000,
    pickupLocation: "N/A — test data, please delete",
  });

  const item = await createDriveItem({
    driveId: drive.id,
    name: "TEST item — safe to delete",
    totalStock: 1,
    perStudentLimit: 1,
  });

  const reserveResult = await reserveBook({
    driveId: drive.id,
    itemId: item.id,
    applicantName: "TEST Applicant (Claude E2E)",
    applicantContact: "test-applicant@example.invalid",
    applicantEmail: "test-applicant@example.invalid",
  });

  const proofUrl = await uploadDonationProof(tinyPngFile());
  if (!proofUrl) {
    return NextResponse.json({ error: "proof upload failed" }, { status: 500 });
  }

  const donation = await createDonation({
    driveId: drive.id,
    donorName: "TEST Donor (Claude E2E)",
    donorContact: null,
    donorEmail: "test-donor@example.invalid",
    amount: 1000,
    proofUrl,
  });

  return NextResponse.json({
    ok: true,
    drive,
    item,
    application: reserveResult.ok ? reserveResult.application : reserveResult,
    donation,
  });
}
