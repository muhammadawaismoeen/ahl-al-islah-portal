"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/app/admin/actions";
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
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

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
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await markAdvisorRead(threadId);
  if (ok) revalidatePath("/admin/counsel");
  return { ok };
}

export async function closeThread(
  threadId: string
): Promise<{ ok: boolean }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
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
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
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
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await deleteThread(threadId);
  if (ok) {
    revalidatePath("/admin/counsel");
    revalidatePath("/counsel");
  }
  return { ok };
}
