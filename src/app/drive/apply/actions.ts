"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { reserveBook, getApplication } from "@/lib/drive-store";
import { addDriveDeviceId, getDriveDeviceIds } from "@/lib/drive-session";
import { DRIVE_WINGS, type DriveWing } from "@/lib/drive-types";
import { notifyNewBookApplication } from "@/lib/notify";

/** Best-effort requester IP — the first hop in x-forwarded-for is the
 *  original client on Vercel's proxy chain. Returns null in the filesystem
 *  dev fallback (no proxy in front of `next dev`), in which case the
 *  application is simply stored without one. */
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
  applicantGender: string;
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
  // Re-validated server-side rather than trusted from the form: the wing
  // drives the supervisor's Drive Day totals and which desk serves the
  // applicant, so a junk value must never reach the record.
  if (!(DRIVE_WINGS as string[]).includes(input.applicantGender)) {
    return { ok: false, error: "Please select Brother or Sister." };
  }
  const gender = input.applicantGender as DriveWing;
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

  // The requester IP is still recorded on the application for the Advisor's
  // audit trail, but it no longer blocks anything: a shared campus/hostel
  // wifi NAT puts many genuine applicants behind one address, and turning
  // them away was costing more real applications than it stopped duplicate
  // ones. The device-cookie check above remains the duplicate guard.
  const ip = await getClientIp();

  try {
    const result = await reserveBook({
      driveId: input.driveId,
      itemId: input.itemId,
      applicantName: name,
      applicantContact: contact,
      applicantEmail,
      applicantDepartment: department,
      applicantYearOfStudy: yearOfStudy,
      applicantGender: gender,
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
