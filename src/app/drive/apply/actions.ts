"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { reserveBook, getApplication, listApplications, normalizeContact } from "@/lib/drive-store";
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
        error: "An application for this Drive was already submitted.",
      };
    }
  }

  // Same-network abuse check: an incognito window or a second browser
  // clears the device cookie above, but not the network it's on. If any
  // OTHER application for this drive was submitted from the same IP under
  // different details, refuse for the same reason as the device check.
  // Shared campus/hostel wifi can occasionally put two genuine applicants
  // behind one address — the identity-match escape hatch below still lets
  // that pair each apply once, it only blocks a THIRD identity repeating
  // from that address.
  const ip = await getClientIp();
  if (ip) {
    const sameDriveApps = await listApplications(input.driveId);
    const priorFromThisIp = sameDriveApps.filter((a) => a.submittedIp === ip);
    const matchesPriorIpIdentity = priorFromThisIp.some(
      (a) =>
        normalizeContact(a.applicantContact) === normalizeContact(contact) ||
        (a.applicantEmail?.trim().toLowerCase() ?? "") === applicantEmail.trim().toLowerCase()
    );
    if (priorFromThisIp.length > 0 && !matchesPriorIpIdentity) {
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
