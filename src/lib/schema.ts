import { z, ZodTypeAny } from "zod";
import type { Field, QuestionSet } from "./questions";

/**
 * Build a Zod schema dynamically from a QuestionSet. Validation rules
 * (required, minLength, pattern for email/tel/url) are derived from
 * each field's declarative config.
 */
export function buildSchemaForQuestionSet(qs: QuestionSet) {
  const shape: Record<string, ZodTypeAny> = {};

  for (const section of qs.sections) {
    for (const field of section.fields) {
      shape[field.id] = fieldToZod(field);
    }
  }

  return z.object(shape);
}

function fieldToZod(field: Field): ZodTypeAny {
  switch (field.type) {
    case "email": {
      const base = z
        .string()
        .trim()
        .email({ message: "Please enter a valid email address." });
      return field.required
        ? base.min(1, { message: "This field is required." })
        : base.or(z.literal("")).optional();
    }
    case "url": {
      const base = z.string().trim().url({ message: "Must be a valid URL." });
      return field.required
        ? base
        : base.or(z.literal("")).optional();
    }
    case "tel": {
      const base = z
        .string()
        .trim()
        .regex(/^[+\d\s()\-]{6,20}$/, {
          message: "Enter a valid phone number (digits, +, spaces, or dashes).",
        });
      return field.required
        ? base.min(1, { message: "This field is required." })
        : base.or(z.literal("")).optional();
    }
    case "number": {
      let base = z.coerce.number({
        invalid_type_error: "Enter a valid number.",
      });
      if (field.min !== undefined) {
        base = base.min(field.min, { message: `Must be at least ${field.min}.` });
      }
      if (field.max !== undefined) {
        base = base.max(field.max, { message: `Must be at most ${field.max}.` });
      }
      return field.required ? base : base.optional();
    }
    case "textarea":
    case "text": {
      let base = z.string().trim();
      if (field.minLength !== undefined) {
        base = base.min(field.minLength, {
          message: `Please provide at least ${field.minLength} characters.`,
        });
      }
      if (field.maxLength !== undefined) {
        base = base.max(field.maxLength, {
          message: `Please keep under ${field.maxLength} characters.`,
        });
      }
      if (field.required) {
        return base.min(Math.max(1, field.minLength ?? 1), {
          message: "This field is required.",
        });
      }
      return base.optional().or(z.literal(""));
    }
    case "select":
    case "radio": {
      if (!field.options?.length) {
        return field.required ? z.string().min(1) : z.string().optional();
      }
      const values = field.options.map((o) => o.value) as [string, ...string[]];
      const base = z.enum(values, {
        errorMap: () => ({ message: "Please select one option." }),
      });
      return field.required ? base : base.optional();
    }
    case "checkbox": {
      // We store as array of selected option values
      let base = z.array(z.string());
      if (field.required) {
        const min = field.minSelected ?? 1;
        base = base.min(min, {
          message: `Please select at least ${min}.`,
        });
      }
      return base;
    }
    case "date": {
      let base = z.string().trim();
      if (field.required) base = base.min(1, { message: "This field is required." });
      return base;
    }
    default:
      return z.any();
  }
}

export function defaultValuesForQuestionSet(qs: QuestionSet) {
  const values: Record<string, string | string[]> = {};
  for (const section of qs.sections) {
    for (const field of section.fields) {
      if (field.type === "checkbox") {
        values[field.id] = [];
      } else {
        values[field.id] = "";
      }
    }
  }
  return values;
}
