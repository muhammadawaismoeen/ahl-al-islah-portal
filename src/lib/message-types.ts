/**
 * Shared message types and constants — safe to import from client components.
 * All I/O functions live in message-store.ts (server-only).
 */

export type MessageRole =
  | "female-head"
  | "female-deputy"
  | "male-head"
  | "male-deputy";

export const ROLE_LABELS: Record<MessageRole, string> = {
  "female-head": "Head of Sisters' Cohort",
  "female-deputy": "Deputy Head of Sisters' Cohort",
  "male-head": "Head of Brothers' Cohort",
  "male-deputy": "Deputy Head of Brothers' Cohort",
};

export interface AdvisorMessage {
  id: string;
  senderName: string;
  role: MessageRole;
  whatsapp: string;
  subject: string;
  body: string;
  submittedAt: string;
  status: "unread" | "read" | "replied";
  reply?: string;
  repliedAt?: string;
}
