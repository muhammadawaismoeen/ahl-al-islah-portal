/**
 * Anonymous feedback types — safe to import from client components.
 * All I/O lives in feedback-store.ts (server-only).
 */

export type ResponseChannel =
  | "none"
  | "whatsapp"
  | "in-person"
  | "next-gathering"
  | "other";

export const RESPONSE_CHANNEL_LABELS: Record<ResponseChannel, string> = {
  none: "No response needed",
  whatsapp: "WhatsApp message",
  "in-person": "In person",
  "next-gathering": "At the next gathering",
  other: "Other (specified below)",
};

export type Rating = "excellent" | "good" | "average" | "needs-improvement" | "";

export const RATING_LABELS: Record<Exclude<Rating, "">, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  "needs-improvement": "Needs improvement",
};

export interface FeedbackEntry {
  id: string;
  submittedAt: string;
  status: "unread" | "read";

  // All optional — feedback can be fully anonymous
  name?: string;
  whatsapp?: string;

  // Feedback content
  gatheringReflection?: string;
  gatheringRating?: Rating;
  advisorReflection?: string;
  advisorRating?: Rating;
  questions?: string;
  preferredChannel?: ResponseChannel;
  channelOther?: string;
  additionalNotes?: string;
}
