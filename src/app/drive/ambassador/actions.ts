"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { registerAmbassador } from "@/lib/drive-store";
import { isAmbassadorEmail, AMBASSADOR_EMAIL_DOMAIN } from "@/lib/drive-config";

export async function registerAmbassadorAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return { ok: false, error: "Please sign in with Google to continue." };
  }
  if (!isAmbassadorEmail(email)) {
    return {
      ok: false,
      error: `Ambassador registration is only open to ${AMBASSADOR_EMAIL_DOMAIN} student accounts.`,
    };
  }

  const driveId = ((formData.get("driveId") as string) ?? "").trim();
  const name = ((formData.get("name") as string) ?? "").trim();
  const contact = ((formData.get("contact") as string) ?? "").trim() || undefined;
  const ownTarget = Number(formData.get("ownTarget"));
  const chosenTarget = Number(formData.get("chosenTarget"));

  if (!driveId) return { ok: false, error: "Please choose a drive." };
  if (name.length < 2) return { ok: false, error: "Please enter your full name." };
  if (!Number.isFinite(ownTarget) || ownTarget <= 0) {
    return { ok: false, error: "Please enter a valid target amount." };
  }

  const result = await registerAmbassador({
    driveId,
    name,
    email,
    contact,
    ownTarget,
    chosenTarget,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/drive/ambassador");
  revalidatePath("/admin/drive");
  return { ok: true };
}
