"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/app/admin/actions";
import {
  updateSubmission,
  deleteSubmission,
} from "@/lib/activity-submissions-store";

export async function markSubmissionRead(
  id: string
): Promise<{ ok: boolean }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await updateSubmission(id, { status: "read" });
  if (ok) revalidatePath("/admin/activity-submissions");
  return { ok };
}

export async function removeSubmission(
  id: string
): Promise<{ ok: boolean }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await deleteSubmission(id);
  if (ok) revalidatePath("/admin/activity-submissions");
  return { ok };
}
