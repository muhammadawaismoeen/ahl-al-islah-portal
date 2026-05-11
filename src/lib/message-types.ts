/**
 * Shared message types and constants — safe to import from client components.
 * All I/O functions live in message-store.ts (server-only).
 */

export type MessageRole =
  | "female-head"
  | "male-head"
  | "core-member";

export const ROLE_LABELS: Record<MessageRole, string> = {
  "female-head": "Head of Sisters' Cohort",
  "male-head": "Head of Brothers' Cohort",
  "core-member": "Core Member",
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
