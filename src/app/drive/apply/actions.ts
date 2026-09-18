"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { reserveBook } from "@/lib/drive-store";
import { addDriveDeviceId } from "@/lib/drive-session";
import { notifyNewBookApplication } from "@/lib/notify";
import { isCollegeEmail, COLLEGE_EMAIL_DOMAIN } from "@/lib/drive-config";

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
  if (!isCollegeEmail(applicantEmail)) {
    return {
      ok: false,
      error: `Book applications are only open to ${COLLEGE_EMAIL_DOMAIN} student accounts.`,
    };
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
