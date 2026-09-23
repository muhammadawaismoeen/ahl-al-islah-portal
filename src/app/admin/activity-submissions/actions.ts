"use server";

import { revalidatePath } from "next/cache";
import { getFeaturePermission } from "@/app/admin/actions";
import { canEdit, canDelete } from "@/lib/admin-permissions";
import {
  updateSubmission,
  deleteSubmission,
} from "@/lib/activity-submissions-store";

export async function markSubmissionRead(
  id: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.activity-audits");
  if (!canEdit(tier)) return { ok: false };
  const ok = await updateSubmission(id, { status: "read" });
  if (ok) revalidatePath("/admin/activity-submissions");
  return { ok };
}

export async function removeSubmission(
  id: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.activity-audits");
  if (!canDelete(tier)) return { ok: false };
  const ok = await deleteSubmission(id);
  if (ok) revalidatePath("/admin/activity-submissions");
  return { ok };
}
