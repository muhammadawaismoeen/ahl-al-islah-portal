"use server";

import { saveFeedback } from "@/lib/feedback-store";
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
  const name = clean(formData.get("name"), 100);
  const whatsapp = clean(formData.get("whatsapp"), 30);
  const gatheringReflection = clean(formData.get("gatheringReflection"));
  const gatheringRatingRaw = clean(formData.get("gatheringRating"), 50) ?? "";
  const advisorReflection = clean(formData.get("advisorReflection"));
  const advisorRatingRaw = clean(formData.get("advisorRating"), 50) ?? "";
  const deepestLine = clean(formData.get("deepestLine"), 1000);
  const questions = clean(formData.get("questions"));
  const preferredChannelRaw = clean(formData.get("preferredChannel"), 50);
  const channelOther = clean(formData.get("channelOther"), 200);
  const additionalNotes = clean(formData.get("additionalNotes"));

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

  // Require at least one substantive field — otherwise it's an empty form
  const hasAnyContent =
    gatheringReflection ||
    advisorReflection ||
    deepestLine ||
    questions ||
    additionalNotes ||
    gatheringRating ||
    advisorRating;

  if (!hasAnyContent) {
    return {
      ok: false,
      error: "Please share at least one piece of feedback before submitting.",
    };
  }

  try {
    const record = await saveFeedback({
      name,
      whatsapp,
      gatheringReflection,
      gatheringRating,
      advisorReflection,
      advisorRating,
      deepestLine,
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
