"use server";

import { revalidatePath } from "next/cache";
import { getFeaturePermission } from "@/app/admin/actions";
import { canEdit, canDelete } from "@/lib/admin-permissions";
import { updateMessage, deleteMessage } from "@/lib/message-store";

export async function replyToMessage(
  id: string,
  reply: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("community.messages");
  if (!canEdit(tier)) return { ok: false, error: "You don't have permission to reply." };

  const ok = await updateMessage(id, {
    status: "replied",
    reply: reply.trim(),
    repliedAt: new Date().toISOString(),
  });

  if (ok) revalidatePath("/admin/messages");
  return { ok, error: ok ? undefined : "Message not found." };
}

export async function markAsRead(
  id: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.messages");
  if (!canEdit(tier)) return { ok: false };
  const ok = await updateMessage(id, { status: "read" });
  if (ok) revalidatePath("/admin/messages");
  return { ok };
}

export async function removeMessage(
  id: string
): Promise<{ ok: boolean }> {
  const tier = await getFeaturePermission("community.messages");
  if (!canDelete(tier)) return { ok: false };
  const ok = await deleteMessage(id);
  if (ok) revalidatePath("/admin/messages");
  return { ok };
}
