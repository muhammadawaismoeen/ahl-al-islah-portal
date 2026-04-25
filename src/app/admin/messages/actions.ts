"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/app/admin/actions";
import { updateMessage, deleteMessage } from "@/lib/message-store";

export async function replyToMessage(
  id: string,
  reply: string
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

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
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await updateMessage(id, { status: "read" });
  if (ok) revalidatePath("/admin/messages");
  return { ok };
}

export async function removeMessage(
  id: string
): Promise<{ ok: boolean }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await deleteMessage(id);
  if (ok) revalidatePath("/admin/messages");
  return { ok };
}
