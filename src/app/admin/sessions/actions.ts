"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/app/admin/actions";
import {
  createSession,
  updateSession,
  deleteSession,
  addActivity,
  updateActivity,
  removeActivity,
} from "@/lib/sessions-store";

/* ------------------------------------------------------------------ */
/*  Session CRUD                                                       */
/* ------------------------------------------------------------------ */

export async function createSessionAction(formData: FormData): Promise<void> {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin");

  const title = String(formData.get("title") ?? "").trim();
  const arabicTitle = String(formData.get("arabicTitle") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const meetingLink = String(formData.get("meetingLink") ?? "").trim();

  if (!title || !date) redirect("/admin/sessions/new");

  const record = await createSession({
    title,
    arabicTitle: arabicTitle || undefined,
    date,
    description: description || undefined,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    meetingLink: meetingLink || undefined,
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  redirect(`/admin/sessions/${record.id}`);
}

export async function updateSessionAction(
  sessionId: string,
  formData: FormData
): Promise<void> {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin");

  const title = String(formData.get("title") ?? "").trim();
  const arabicTitle = String(formData.get("arabicTitle") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const meetingLink = String(formData.get("meetingLink") ?? "").trim();

  if (!title || !date) redirect(`/admin/sessions/${sessionId}`);

  const result = await updateSession(sessionId, {
    title,
    arabicTitle: arabicTitle || undefined,
    date,
    description: description || undefined,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    meetingLink: meetingLink || undefined,
  });

  if (!result) redirect("/admin/sessions");

  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath("/sessions");
  revalidatePath(`/sessions/${result.slug}`);
  redirect(`/admin/sessions/${sessionId}`);
}

export async function deleteSessionAction(
  sessionId: string
): Promise<{ ok: boolean }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await deleteSession(sessionId);
  if (ok) {
    revalidatePath("/admin/sessions");
    revalidatePath("/sessions");
  }
  return { ok };
}

/* ------------------------------------------------------------------ */
/*  Activity CRUD                                                      */
/* ------------------------------------------------------------------ */

export async function addActivityAction(
  sessionId: string,
  formData: FormData
): Promise<void> {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin");

  const title = String(formData.get("title") ?? "").trim();
  const timeMarker = String(formData.get("timeMarker") ?? "").trim();
  const durationRaw = String(formData.get("durationMin") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) redirect(`/admin/sessions/${sessionId}/activities/new`);

  const durationMin = durationRaw ? parseInt(durationRaw, 10) : undefined;

  const result = await addActivity(sessionId, {
    title,
    timeMarker: timeMarker || undefined,
    durationMin: Number.isFinite(durationMin) ? durationMin : undefined,
    body,
  });

  if (!result) redirect("/admin/sessions");

  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath("/sessions");
  redirect(`/admin/sessions/${sessionId}`);
}

export async function updateActivityAction(
  sessionId: string,
  activityId: string,
  formData: FormData
): Promise<void> {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin");

  const title = String(formData.get("title") ?? "").trim();
  const timeMarker = String(formData.get("timeMarker") ?? "").trim();
  const durationRaw = String(formData.get("durationMin") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body)
    redirect(`/admin/sessions/${sessionId}/activities/${activityId}`);

  const durationMin = durationRaw ? parseInt(durationRaw, 10) : undefined;

  const result = await updateActivity(sessionId, activityId, {
    title,
    timeMarker: timeMarker || undefined,
    durationMin: Number.isFinite(durationMin) ? durationMin : undefined,
    body,
  });

  if (!result) redirect("/admin/sessions");

  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath("/sessions");
  redirect(`/admin/sessions/${sessionId}`);
}

export async function removeActivityAction(
  sessionId: string,
  activityId: string
): Promise<{ ok: boolean }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false };
  const ok = await removeActivity(sessionId, activityId);
  if (ok) {
    revalidatePath(`/admin/sessions/${sessionId}`);
    revalidatePath("/sessions");
  }
  return { ok };
}

/* ------------------------------------------------------------------ */
/*  Seed: Identity Pillars Audit (one-click first session)             */
/* ------------------------------------------------------------------ */

export async function seedIdentityPillarsActivity(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authorised." };

  const session = await createSession({
    title: "Ibrahim عليه السلام: Khalilullah — The Man Who Founded It All",
    arabicTitle: "إبراهيم عليه السلام",
    date: "2026-06-14",
    description:
      "The founding session — walking through Ibrahim's journey of Fitra, Yaqeen, and Tawakkul, closing with the Identity Pillars Audit.",
  });

  const body = [
    "We have walked through three stages of Ibrahim's journey tonight. Fitra — the compass. Yaqeen — the certainty that acts alone. Tawakkul — the act that releases the outcome.",
    "Now I want you to do something for yourself. I want you to identify your identity pillars.",
    "Not your values in theory. Your pillars in practice — the things you actually build your decisions on. The non-negotiables. The lines you have drawn. The things that, if removed, would mean you are no longer you.",
    "[give writing instructions clearly — slow down]",
    "I want you to open your notes — phone, paper, whatever you have. And I want you to write three pillars. Three non-negotiables in your life right now. Not what you wish they were — what they actually are. The three things that currently define how you make decisions.",
    "[4 minutes of writing time — hold silence, do not fill it]",
    "Done? Now — next to each pillar, write one letter. Either A or B.",
    "A means: this pillar is Allah-grounded. It holds even if everyone around me disagrees. It would survive the fire, the rejection, the empty valley. It is mine — not the environment's.",
    "B means: this pillar is approval-grounded. It depends on being validated by people around me — my family, my professors, my peers, the culture of the ward. If they withdrew their approval, this pillar would shake.",
    "[2 minutes — let them assess honestly]",
    "I am not asking you to share your B's. I am just asking you to be honest with yourself.",
    "But I do want 2 or 3 people to share one of their A pillars. Something that is genuinely Allah-grounded — even in a medical environment.",
    "[take 2 to 3 shares — affirm each one briefly: 'that is a pillar', 'hold onto that']",
    "Ibrahim had one pillar. Just one. La ilaha illallah. And every test — the star, the moon, the sun, his father, the fire, the migration, the valley — every single test was the same question: will you hold this pillar even now?",
    "He held it every time.",
    "Your pillars — the A ones — are the beginning of your Millah. That is what we are building.",
  ].join("\n");

  await addActivity(session.id, {
    title: "Identity Pillars Audit",
    timeMarker: "1:05",
    durationMin: 15,
    body,
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  return { ok: true };
}
