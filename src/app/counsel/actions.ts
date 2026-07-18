"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createThread,
  addMessage,
  getThread,
  findThreadByClaimCode,
  markSeekerRead,
  deleteThread,
  generateClaimCode,
} from "@/lib/counsel-store";
import type { CounselCohort } from "@/lib/counsel-types";

const COOKIE = "ahl_counsel_thread";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export async function getCurrentThreadId(): Promise<string | null> {
  const val = (await cookies()).get(COOKIE)?.value;
  return val ?? null;
}

async function setThreadCookie(threadId: string) {
  (await cookies()).set(COOKIE, threadId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function startCounselThread(
  formData: FormData
): Promise<{ ok: boolean; error?: string; claimCode?: string }> {
  const body = ((formData.get("body") as string) ?? "").trim();
  const cohortRaw = ((formData.get("cohort") as string) ?? "").trim();

  if (body.length < 10) {
    return {
      ok: false,
      error: "Please write a longer message (at least 10 characters).",
    };
  }
  if (body.length > 5000) {
    return { ok: false, error: "Message is too long (max 5000 characters)." };
  }

  const cohort: CounselCohort | undefined =
    cohortRaw === "brothers" || cohortRaw === "sisters" ? cohortRaw : undefined;

  const claimCode = generateClaimCode();
  await createThread({
    firstMessage: body,
    cohort,
    claimCode,
  });

  revalidatePath("/admin/counsel");
  return { ok: true, claimCode };
}

export async function postSeekerMessage(
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = body.trim();
  if (trimmed.length < 1) return { ok: false, error: "Message is empty." };
  if (trimmed.length > 5000) return { ok: false, error: "Message is too long." };

  const threadId = await getCurrentThreadId();
  if (!threadId) return { ok: false, error: "No active thread. Please start a new one." };

  const thread = await getThread(threadId);
  if (!thread) {
    (await cookies()).delete(COOKIE);
    return { ok: false, error: "Thread was not found. It may have been deleted." };
  }

  if (thread.status === "closed") {
    return { ok: false, error: "This thread has been closed by the Advisor." };
  }

  await addMessage(threadId, "seeker", trimmed);
  revalidatePath("/counsel");
  revalidatePath("/admin/counsel");
  return { ok: true };
}

export async function claimThreadByCode(
  code: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Please enter a claim code." };

  const thread = await findThreadByClaimCode(normalized);
  if (!thread) {
    return {
      ok: false,
      error:
        "That claim code doesn't match any thread. Double-check for typos, or start a new thread.",
    };
  }

  await setThreadCookie(thread.id);
  revalidatePath("/counsel");
  return { ok: true };
}

export async function markMyThreadRead(): Promise<void> {
  const threadId = await getCurrentThreadId();
  if (!threadId) return;
  await markSeekerRead(threadId);
  revalidatePath("/counsel");
}

export async function endMyThread(): Promise<{ ok: boolean }> {
  const threadId = await getCurrentThreadId();
  if (!threadId) return { ok: false };
  await deleteThread(threadId);
  (await cookies()).delete(COOKIE);
  revalidatePath("/counsel");
  revalidatePath("/admin/counsel");
  return { ok: true };
}

export async function forgetThreadOnThisDevice(): Promise<void> {
  (await cookies()).delete(COOKIE);
  revalidatePath("/counsel");
}
