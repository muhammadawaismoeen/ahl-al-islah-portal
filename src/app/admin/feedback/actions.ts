"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/app/admin/actions";
import { updateFeedback, deleteFeedback } from "@/lib/feedback-store";

export async function markFeedbackRead(
  id: string
): Promise<{ ok: boolean }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await updateFeedback(id, { status: "read" });
  if (ok) revalidatePath("/admin/feedback");
  return { ok };
}

export async function removeFeedback(
  id: string
): Promise<{ ok: boolean }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await deleteFeedback(id);
  if (ok) revalidatePath("/admin/feedback");
  return { ok };
}
