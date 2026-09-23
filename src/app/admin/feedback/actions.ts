"use server";

import { revalidatePath } from "next/cache";
import { getFeaturePermission } from "@/app/admin/actions";
import { canEdit, canDelete } from "@/lib/admin-permissions";
import { updateFeedback, deleteFeedback } from "@/lib/feedback-store";

export async function markFeedbackRead(
  id: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.feedback");
  if (!canEdit(tier)) return { ok: false };
  const ok = await updateFeedback(id, { status: "read" });
  if (ok) revalidatePath("/admin/feedback");
  return { ok };
}

export async function removeFeedback(
  id: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.feedback");
  if (!canDelete(tier)) return { ok: false };
  const ok = await deleteFeedback(id);
  if (ok) revalidatePath("/admin/feedback");
  return { ok };
}
