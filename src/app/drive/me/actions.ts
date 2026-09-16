"use server";

import { revalidatePath } from "next/cache";
import { findApplicationByPickupCode, findDonationByRefCode } from "@/lib/drive-store";
import { addDriveDeviceId } from "@/lib/drive-session";

export async function claimByCodeAction(
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Please enter a code." };

  const application = await findApplicationByPickupCode(normalized);
  if (application) {
    await addDriveDeviceId("applications", application.id);
    revalidatePath("/drive/me");
    return { ok: true };
  }

  const donation = await findDonationByRefCode(normalized);
  if (donation) {
    await addDriveDeviceId("donations", donation.id);
    revalidatePath("/drive/me");
    return { ok: true };
  }

  return {
    ok: false,
    error: "That code doesn't match any application or donation.",
  };
}
