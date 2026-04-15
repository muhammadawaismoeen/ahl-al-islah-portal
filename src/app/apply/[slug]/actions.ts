"use server";

import { revalidatePath } from "next/cache";
import { getPositionBySlug } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import { buildSchemaForQuestionSet } from "@/lib/schema";
import { saveSubmission } from "@/lib/storage";
import { notifyNewSubmission } from "@/lib/notify";

export interface SubmitResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  submissionId?: string;
}

export async function submitApplication(
  slug: string,
  rawData: Record<string, unknown>
): Promise<SubmitResult> {
  const position = getPositionBySlug(slug);
  if (!position) {
    return { ok: false, error: "Position not found." };
  }
  if (!position.open) {
    return { ok: false, error: "Applications for this position are closed." };
  }

  const qs = getQuestionSet(position.questionSet);
  if (!qs) {
    return { ok: false, error: "Question set missing. Contact the Advisor." };
  }

  const schema = buildSchemaForQuestionSet(qs);
  const parsed = schema.safeParse(rawData);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: "Please fix the highlighted fields and try again.",
      fieldErrors,
    };
  }

  const record = await saveSubmission({
    positionSlug: position.slug,
    positionTitle: position.title,
    wing: position.wing,
    data: parsed.data as Record<string, unknown>,
  });

  // Fire-and-forget notification (non-blocking failure)
  try {
    await notifyNewSubmission(record);
  } catch {
    // swallow — submission is saved either way
  }

  revalidatePath("/admin");

  return { ok: true, submissionId: record.id };
}
