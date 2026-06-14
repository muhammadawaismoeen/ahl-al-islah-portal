"use server";

import { saveFeedback } from "@/lib/feedback-store";
import { getSession } from "@/lib/sessions-store";
import type { ResponseChannel, Rating } from "@/lib/feedback-types";

export interface FeedbackResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const VALID_CHANNELS: ResponseChannel[] = [
  "none",
  "whatsapp",
  "in-person",
  "next-gathering",
  "other",
];

const VALID_RATINGS: Rating[] = [
  "",
  "excellent",
  "good",
  "average",
  "needs-improvement",
];

function clean(value: FormDataEntryValue | null, maxLen = 3000): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

export async function submitFeedback(
  formData: FormData
): Promise<FeedbackResult> {
  const sessionId = clean(formData.get("sessionId"), 100);
  const name = clean(formData.get("name"), 100);
  const whatsapp = clean(formData.get("whatsapp"), 30);
  const gatheringReflection = clean(formData.get("gatheringReflection"));
  const gatheringRatingRaw = clean(formData.get("gatheringRating"), 50) ?? "";
  const advisorReflection = clean(formData.get("advisorReflection"));
  const advisorRatingRaw = clean(formData.get("advisorRating"), 50) ?? "";
  const deepestLine = clean(formData.get("deepestLine"), 1000);
  const oneChange = clean(formData.get("oneChange"), 1000);
  const questions = clean(formData.get("questions"));
  const preferredChannelRaw = clean(formData.get("preferredChannel"), 50);
  const channelOther = clean(formData.get("channelOther"), 200);
  const additionalNotes = clean(formData.get("additionalNotes"));

  // Validate session — look up to snapshot title so the admin still
  // sees the title even if the session is later renamed.
  let sessionTitle: string | undefined;
  if (sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
      return {
        ok: false,
        error:
          "The selected session is no longer available. Please refresh and pick again.",
      };
    }
    sessionTitle = session.title;
  }

  // Validate rating values
  const gatheringRating = VALID_RATINGS.includes(gatheringRatingRaw as Rating)
    ? (gatheringRatingRaw as Rating)
    : "";
  const advisorRating = VALID_RATINGS.includes(advisorRatingRaw as Rating)
    ? (advisorRatingRaw as Rating)
    : "";

  // Validate channel
  const preferredChannel =
    preferredChannelRaw && VALID_CHANNELS.includes(preferredChannelRaw as ResponseChannel)
      ? (preferredChannelRaw as ResponseChannel)
      : undefined;

  // All fields required except `name`. WhatsApp is required only when the
  // preferred response channel is "whatsapp". `channelOther` is required only
  // when the preferred channel is "other".
  const missing: string[] = [];
  if (!sessionId) missing.push("session selection");
  if (!gatheringRating) missing.push("session rating");
  if (!gatheringReflection) missing.push("what stayed with you");
  if (!deepestLine) missing.push("the line that struck you most");
  if (!oneChange) missing.push("one change for this week");
  if (!advisorRating) missing.push("Advisor delivery rating");
  if (!advisorReflection) missing.push("thoughts on the Advisor's delivery");
  if (!questions) missing.push("your questions");
  if (!preferredChannel) missing.push("preferred response channel");
  if (preferredChannel === "whatsapp" && !whatsapp) {
    missing.push("WhatsApp number");
  }
  if (preferredChannel === "other" && !channelOther) {
    missing.push("how you'd like to be contacted");
  }
  if (!additionalNotes) missing.push("anything else (write 'nothing' if blank)");

  if (missing.length) {
    return {
      ok: false,
      error: `Please complete: ${missing.join(", ")}.`,
    };
  }

  try {
    const record = await saveFeedback({
      sessionId,
      sessionTitle,
      name,
      whatsapp,
      gatheringReflection,
      gatheringRating,
      advisorReflection,
      advisorRating,
      deepestLine,
      oneChange,
      questions,
      preferredChannel,
      channelOther,
      additionalNotes,
    });
    return { ok: true, id: record.id };
  } catch (err) {
    console.error("Failed to save feedback:", err);
    return { ok: false, error: "Failed to submit feedback. Please try again." };
  }
}
