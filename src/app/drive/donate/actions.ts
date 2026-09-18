"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createDonation, listAmbassadors } from "@/lib/drive-store";
import { addDriveDeviceId } from "@/lib/drive-session";
import { uploadDonationProof, MAX_PROOF_BYTES } from "@/lib/donation-upload";
import { notifyNewDonation } from "@/lib/notify";

export async function submitDonationAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; refCode?: string }> {
  const session = await auth();
  const donorEmail = session?.user?.email;
  if (!donorEmail) {
    return { ok: false, error: "Please sign in with Google to continue." };
  }

  const driveIdRaw = ((formData.get("driveId") as string) ?? "").trim();
  const driveId = driveIdRaw === "" || driveIdRaw === "general" ? null : driveIdRaw;
  const donorName = ((formData.get("donorName") as string) ?? "").trim();
  const donorContact = ((formData.get("donorContact") as string) ?? "").trim();
  const amountRaw = (formData.get("amount") as string) ?? "";
  const amount = Number(amountRaw);
  const proofFile = formData.get("proof") as File | null;
  const ambassadorIdRaw = ((formData.get("ambassadorId") as string) ?? "").trim();

  if (!donorName) {
    return { ok: false, error: "Please enter your full name." };
  }
  if (!donorContact) {
    return { ok: false, error: "Please enter your contact number." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Please enter a valid donation amount." };
  }
  if (!proofFile || proofFile.size === 0) {
    return { ok: false, error: "Please attach your proof of transfer." };
  }
  if (proofFile.size > MAX_PROOF_BYTES) {
    return {
      ok: false,
      error: `Proof file is too large — the maximum is ${Math.round(
        MAX_PROOF_BYTES / 1024
      )} KB. Please compress it and try again.`,
    };
  }

  let ambassadorId: string | null = null;
  if (ambassadorIdRaw) {
    const ambassadors = await listAmbassadors(driveId ?? undefined);
    const match = ambassadors.find(
      (a) => a.id === ambassadorIdRaw && a.status === "approved"
    );
    if (!match) {
      return { ok: false, error: "That Ambassador isn't available for this drive." };
    }
    ambassadorId = match.id;
  }

  try {
    const proofUrl = await uploadDonationProof(proofFile);
    if (!proofUrl) {
      return {
        ok: false,
        error: "That file couldn't be uploaded — use an image or PDF under the size limit.",
      };
    }

    const donation = await createDonation({
      driveId,
      donorName,
      donorContact,
      donorEmail,
      amount,
      proofUrl,
      ambassadorId,
    });

    await addDriveDeviceId("donations", donation.id);
    try {
      await notifyNewDonation(donation);
    } catch {
      // swallow — donation is saved either way
    }

    revalidatePath("/drive");
    revalidatePath("/admin/drive");
    return { ok: true, refCode: donation.refCode };
  } catch (err) {
    console.error("[drive] submitDonationAction failed:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Couldn't submit your donation: ${detail}` };
  }
}
