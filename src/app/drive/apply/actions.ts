"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { reserveBook, getApplication, listApplications } from "@/lib/drive-store";
import { addDriveDeviceId, getDriveDeviceIds } from "@/lib/drive-session";
import { notifyNewBookApplication } from "@/lib/notify";

/** Best-effort requester IP — the first hop in x-forwarded-for is the
 *  original client on Vercel's proxy chain. Returns null in the filesystem
 *  dev fallback (no proxy in front of `next dev`), which quietly disables
 *  this specific check locally without affecting anything else. */
async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip");
}

export async function reserveBookAction(input: {
  driveId: string;
  itemId: string;
  applicantName: string;
  applicantContact: string;
  applicantDepartment: string;
  applicantYearOfStudy: string;
}): Promise<{ ok: boolean; error?: string; applicationId?: string }> {
  const session = await auth();
  const applicantEmail = session?.user?.email;
  if (!applicantEmail) {
    return { ok: false, error: "Please sign in with Google to continue." };
  }

  const name = input.applicantName.trim();
  const contact = input.applicantContact.trim();
  const department = input.applicantDepartment.trim();
  const yearOfStudy = input.applicantYearOfStudy.trim();

  if (name.length < 2) {
    return { ok: false, error: "Please enter your full name." };
  }
  const contactDigits = contact.replace(/\D/g, "");
  if (contactDigits.length < 10) {
    return { ok: false, error: "Please enter a valid phone number." };
  }
  if (!department) {
    return { ok: false, error: "Please select your department." };
  }
  if (!yearOfStudy) {
    return { ok: false, error: "Please select your year of study." };
  }
  if (!input.driveId || !input.itemId) {
    return { ok: false, error: "Please choose an item." };
  }

  // Same-device abuse check: this browser's device cookie remembers every
  // application id it has ever submitted (see drive-session.ts). No
  // exceptions here — once this device holds ANY application for this
  // drive, every further attempt from it is refused outright, even under a
  // matching name/contact/Google account. A cookie is not a real device
  // fingerprint (clearing it resets this signal), so this raises the bar
  // without pretending to be airtight.
  const deviceIds = await getDriveDeviceIds();
  if (deviceIds.applications.length > 0) {
    const priorOnThisDrive = (
      await Promise.all(deviceIds.applications.map((id) => getApplication(id)))
    ).filter((a): a is NonNullable<typeof a> => !!a && a.driveId === input.driveId);

    if (priorOnThisDrive.length > 0) {
      return {
        ok: false,
        error: "An application for this Drive was already submitted.",
      };
    }
  }

  // Same-network abuse check: an incognito window or a second browser
  // clears the device cookie above, but not the network it's on. No
  // exceptions here either — note this is shared-IP-scoped (e.g. a
  // campus/hostel wifi NAT), so it will also block a second genuine
  // applicant behind the same address; that trade-off is intentional.
  const ip = await getClientIp();
  if (ip) {
    const sameDriveApps = await listApplications(input.driveId);
    const priorFromThisIp = sameDriveApps.filter((a) => a.submittedIp === ip);
    if (priorFromThisIp.length > 0) {
      return {
        ok: false,
        error: "An application for this Drive was already submitted.",
      };
    }
  }

  try {
    const result = await reserveBook({
      driveId: input.driveId,
      itemId: input.itemId,
      applicantName: name,
      applicantContact: contact,
      applicantEmail,
      applicantDepartment: department,
      applicantYearOfStudy: yearOfStudy,
      submittedIp: ip,
    });
    if (!result.ok) return { ok: false, error: result.error };

    await addDriveDeviceId("applications", result.application.id);
    try {
      await notifyNewBookApplication(result.application);
    } catch {
      // swallow — reservation is saved either way
    }

    revalidatePath("/drive");
    revalidatePath("/drive/apply");
    revalidatePath("/admin/drive");
    return { ok: true, applicationId: result.application.id };
  } catch (err) {
    console.error("[drive] reserveBookAction failed:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Couldn't reserve your copy: ${detail}` };
  }
}
