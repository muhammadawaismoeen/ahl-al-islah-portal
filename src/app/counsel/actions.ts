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
import {
  COUNSEL_THREAD_COOKIE as COOKIE,
  COUNSEL_BLOB_COOKIE as BLOB_COOKIE,
} from "@/lib/counsel-types";

const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export async function getCurrentThreadId(): Promise<string | null> {
  const val = (await cookies()).get(COOKIE)?.value;
  return val ?? null;
}

async function setThreadCookies(threadId: string) {
  const jar = await cookies();
  jar.set(COOKIE, threadId, COOKIE_OPTS);
  // Clear the legacy blob-URL hint cookie from the Vercel Blob era.
  jar.delete(BLOB_COOKIE);
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

  if (cohortRaw !== "brothers" && cohortRaw !== "sisters") {
    return { ok: false, error: "Please choose your cohort." };
  }
  const cohort: CounselCohort = cohortRaw;

  try {
    const claimCode = generateClaimCode();
    const thread = await createThread({
      firstMessage: body,
      cohort,
      claimCode,
    });

    // Recognise this device immediately — no post-create lookup needed.
    await setThreadCookies(thread.id);

    revalidatePath("/counsel");
    revalidatePath("/admin/counsel");
    return { ok: true, claimCode };
  } catch (err) {
    // Surface the failure in the form instead of an opaque 500 — an unhandled
    // throw here leaves the seeker with a dead button and no explanation.
    console.error("[counsel] startCounselThread failed:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Couldn't start your thread: ${detail}` };
  }
}

export async function postSeekerMessage(
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = body.trim();
  if (trimmed.length < 1) return { ok: false, error: "Message is empty." };
  if (trimmed.length > 5000) return { ok: false, error: "Message is too long." };

  const jar = await cookies();
  const threadId = jar.get(COOKIE)?.value ?? null;
  if (!threadId) return { ok: false, error: "No active thread. Please start a new one." };

  const thread = await getThread(threadId);
  if (!thread) {
    // Don't clear the cookie here — a miss can be a transient storage
    // hiccup, and dropping the cookie would lock the seeker out of a live thread.
    return {
      ok: false,
      error: "Couldn't reach your thread just now. Please try again.",
    };
  }

  if (thread.status === "closed") {
    return { ok: false, error: "This thread has been closed by the Advisor." };
  }

  try {
    await addMessage(threadId, "seeker", trimmed, thread);
  } catch (err) {
    console.error("[counsel] postSeekerMessage failed:", err);
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Couldn't send: ${detail}` };
  }
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

  await setThreadCookies(thread.id);
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
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(BLOB_COOKIE);
  revalidatePath("/counsel");
  revalidatePath("/admin/counsel");
  return { ok: true };
}

export async function forgetThreadOnThisDevice(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(BLOB_COOKIE);
  revalidatePath("/counsel");
}
