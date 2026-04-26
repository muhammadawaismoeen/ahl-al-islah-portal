"use server";

import { revalidatePath } from "next/cache";
import { getPositionBySlug } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import type { QuestionSet } from "@/lib/questions";
import { buildSchemaForQuestionSet } from "@/lib/schema";
import { saveSubmission } from "@/lib/storage";
import { notifyNewSubmission } from "@/lib/notify";
import { getContent } from "@/lib/content-store";
import type { FormQuestionSet } from "@/lib/content-types";

/** Convert dynamic form config to QuestionSet for schema building */
function formConfigToQuestionSet(fqs: FormQuestionSet): QuestionSet {
  return {
    id: fqs.id,
    name: fqs.name,
    description: fqs.description,
    sections: fqs.sections.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      arabicTitle: s.arabicTitle,
      fields: s.fields.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder,
        help: f.help,
        required: f.required,
        options: f.options,
        minLength: f.minLength,
        maxLength: f.maxLength,
        min: f.min,
        max: f.max,
        minSelected: f.minSelected,
      })),
    })),
  };
}

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

  // Try dynamic form config first, fall back to static
  const content = await getContent();
  const dynamicConfig = content.formConfig?.[slug];

  let qs: QuestionSet;
  if (dynamicConfig && dynamicConfig.sections.length > 0) {
    qs = formConfigToQuestionSet(dynamicConfig);
  } else {
    const staticQs = getQuestionSet(position.questionSet);
    if (!staticQs) {
      return { ok: false, error: "Question set missing. Contact the Advisor." };
    }
    qs = staticQs;
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

  // For positions open to both wings, derive the actual wing from
  // a "gender" field in the submitted data (value: "male" | "female").
  // This ensures admin filtering by gender works correctly.
  const data = parsed.data as Record<string, unknown>;
  const resolvedWing =
    position.wing === "both"
      ? (data.gender as string) === "male" || (data.gender as string) === "female"
        ? (data.gender as string)
        : "both"
      : position.wing;

  const record = await saveSubmission({
    positionSlug: position.slug,
    positionTitle: position.title,
    wing: resolvedWing,
    data,
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
