"use server";

import { revalidatePath } from "next/cache";
import { getFeaturePermission } from "@/app/admin/actions";
import { canEdit, canDelete } from "@/lib/admin-permissions";
import {
  addMessage,
  deleteThread,
  markAdvisorRead,
  setThreadStatus,
} from "@/lib/counsel-store";

export async function replyToThread(
  threadId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("community.counsel");
  if (!canEdit(tier)) return { ok: false, error: "You don't have permission to reply." };

  const trimmed = body.trim();
  if (trimmed.length < 1) return { ok: false, error: "Reply is empty." };
  if (trimmed.length > 5000) return { ok: false, error: "Reply is too long." };

  const ok = await addMessage(threadId, "advisor", trimmed);
  if (!ok) return { ok: false, error: "Thread not found." };

  revalidatePath("/admin/counsel");
  revalidatePath("/counsel");
  return { ok: true };
}

export async function markThreadRead(
  threadId: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.counsel");
  if (!canEdit(tier)) return { ok: false };
  const ok = await markAdvisorRead(threadId);
  if (ok) revalidatePath("/admin/counsel");
  return { ok };
}

export async function closeThread(
  threadId: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.counsel");
  if (!canEdit(tier)) return { ok: false };
  const ok = await setThreadStatus(threadId, "closed");
  if (ok) {
    revalidatePath("/admin/counsel");
    revalidatePath("/counsel");
  }
  return { ok };
}

export async function reopenThread(
  threadId: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.counsel");
  if (!canEdit(tier)) return { ok: false };
  const ok = await setThreadStatus(threadId, "open");
  if (ok) {
    revalidatePath("/admin/counsel");
    revalidatePath("/counsel");
  }
  return { ok };
}

export async function removeThread(
  threadId: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.counsel");
  if (!canDelete(tier)) return { ok: false };
  const ok = await deleteThread(threadId);
  if (ok) {
    revalidatePath("/admin/counsel");
    revalidatePath("/counsel");
  }
  return { ok };
}
