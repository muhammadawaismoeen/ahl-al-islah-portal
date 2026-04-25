"use server";

import { saveMessage } from "@/lib/message-store";
import type { MessageRole } from "@/lib/message-store";

export interface MessageResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function submitMessage(
  formData: FormData
): Promise<MessageResult> {
  const senderName = (formData.get("senderName") as string)?.trim();
  const role = formData.get("role") as MessageRole;
  const whatsapp = (formData.get("whatsapp") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const passcode = (formData.get("passcode") as string)?.trim();

  // Validate required fields
  if (!senderName || !role || !whatsapp || !subject || !body) {
    return { ok: false, error: "All fields are required." };
  }

  // Optional passcode gate — set ASK_ADVISOR_CODE env var to restrict access
  const requiredCode = process.env.ASK_ADVISOR_CODE;
  if (requiredCode && passcode !== requiredCode) {
    return { ok: false, error: "Invalid access code." };
  }

  // Validate role
  const validRoles: MessageRole[] = [
    "female-head",
    "female-deputy",
    "male-head",
    "male-deputy",
  ];
  if (!validRoles.includes(role)) {
    return { ok: false, error: "Invalid role selected." };
  }

  try {
    const record = await saveMessage({ senderName, role, whatsapp, subject, body });
    return { ok: true, id: record.id };
  } catch (err) {
    console.error("Failed to save message:", err);
    return { ok: false, error: "Failed to send message. Please try again." };
  }
}
