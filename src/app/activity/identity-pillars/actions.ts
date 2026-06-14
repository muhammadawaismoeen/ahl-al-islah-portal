"use server";

import { saveSubmission } from "@/lib/activity-submissions-store";
import { getSession } from "@/lib/sessions-store";
import type {
  IdentityPillar,
  PillarType,
} from "@/lib/activity-submissions-types";

export interface ActivityResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const VALID_TYPES: PillarType[] = ["", "A", "B"];

function clean(value: FormDataEntryValue | null, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function pillarFrom(formData: FormData, index: 1 | 2 | 3): IdentityPillar {
  const text = clean(formData.get(`pillar${index}_text`), 500) ?? "";
  const rawType = clean(formData.get(`pillar${index}_type`), 4) ?? "";
  const type = (VALID_TYPES.includes(rawType as PillarType)
    ? rawType
    : "") as PillarType;
  return { text, type };
}

export async function submitIdentityPillars(
  formData: FormData
): Promise<ActivityResult> {
  const sessionId = clean(formData.get("sessionId"), 100);
  const name = clean(formData.get("name"), 100);
  const reflection = clean(formData.get("reflection"), 2000);

  const pillar1 = pillarFrom(formData, 1);
  const pillar2 = pillarFrom(formData, 2);
  const pillar3 = pillarFrom(formData, 3);

  // Snapshot the session title so the inbox stays meaningful after rename.
  let sessionTitle: string | undefined;
  if (sessionId) {
    const session = await getSession(sessionId);
    if (!session) {
      return {
        ok: false,
        error:
          "The session for this activity is no longer available. Please refresh and try again.",
      };
    }
    sessionTitle = session.title;
  }

  const missing: string[] = [];
  if (!name) missing.push("your name");
  if (!pillar1.text) missing.push("pillar 1");
  if (!pillar1.type) missing.push("pillar 1 classification (A or B)");
  if (!pillar2.text) missing.push("pillar 2");
  if (!pillar2.type) missing.push("pillar 2 classification (A or B)");
  if (!pillar3.text) missing.push("pillar 3");
  if (!pillar3.type) missing.push("pillar 3 classification (A or B)");
  if (!reflection) missing.push("one honest sentence");

  if (missing.length) {
    return {
      ok: false,
      error: `Please complete: ${missing.join(", ")}.`,
    };
  }

  try {
    const record = await saveSubmission({
      sessionId,
      sessionTitle,
      name,
      pillar1,
      pillar2,
      pillar3,
      reflection,
    });
    return { ok: true, id: record.id };
  } catch (err) {
    console.error("Failed to save activity submission:", err);
    return {
      ok: false,
      error: "Could not save your submission. Please try again.",
    };
  }
}
