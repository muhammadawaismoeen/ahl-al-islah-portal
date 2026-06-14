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

  // Session this feedback is about. Snapshotted so the admin still
  // sees the title even if the session is later renamed or removed.
  // Optional for backward-compat with entries submitted before the
  // session-selector was added to the form.
  sessionId?: string;
  sessionTitle?: string;

  // All optional — feedback can be fully anonymous
  name?: string;
  whatsapp?: string;

  // Feedback content. Field labels intentionally generic so the same
  // shape works for any session, not just the first gathering.
  gatheringReflection?: string;
  gatheringRating?: Rating;
  advisorReflection?: string;
  advisorRating?: Rating;
  deepestLine?: string;
  oneChange?: string;
  questions?: string;
  preferredChannel?: ResponseChannel;
  channelOther?: string;
  additionalNotes?: string;
}
