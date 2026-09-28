"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { reserveBook, getApplication, normalizeContact } from "@/lib/drive-store";
import { addDriveDeviceId, getDriveDeviceIds } from "@/lib/drive-session";
import { notifyNewBookApplication } from "@/lib/notify";

export async function reserveBookAction(input: {
  driveId: string;
  itemId: string;
  applicantName: string;
  applicantContact: string;
}): Promise<{ ok: boolean; error?: string; applicationId?: string }> {
  const session = await auth();
  const applicantEmail = session?.user?.email;
  if (!applicantEmail) {
    return { ok: false, error: "Please sign in with Google to continue." };
  }

  const name = input.applicantName.trim();
  const contact = input.applicantContact.trim();

  if (name.length < 2) {
    return { ok: false, error: "Please enter your full name." };
  }
  if (contact.length < 5) {
    return { ok: false, error: "Please enter a valid email or phone number." };
  }
  if (!input.driveId || !input.itemId) {
    return { ok: false, error: "Please choose an item." };
  }

  // Same-device abuse check: this browser's device cookie remembers every
  // application id it has ever submitted (see drive-session.ts). If it
  // already holds one for THIS drive under a different email/contact, someone
  // is switching Google accounts or rewording their number to get around the
  // per-student limit in reserveBook() below — refuse before that check even
  // runs. A cookie is not a real device fingerprint (clearing it resets this
  // signal), so this raises the bar without pretending to be airtight.
  const deviceIds = await getDriveDeviceIds();
  if (deviceIds.applications.length > 0) {
    const priorOnThisDrive = (
      await Promise.all(deviceIds.applications.map((id) => getApplication(id)))
    ).filter((a): a is NonNullable<typeof a> => !!a && a.driveId === input.driveId);

    const matchesPriorIdentity = priorOnThisDrive.some(
      (a) =>
        normalizeContact(a.applicantContact) === normalizeContact(contact) ||
        (a.applicantEmail?.trim().toLowerCase() ?? "") === applicantEmail.trim().toLowerCase()
    );
    if (priorOnThisDrive.length > 0 && !matchesPriorIdentity) {
      return {
        ok: false,
        error:
          "This device already has an application for this drive under different details. Please continue with the same name, contact, and Google account, or reach out to us if this is a mistake.",
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
