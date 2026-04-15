"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, Controller, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Field, QuestionSet, Section } from "@/lib/questions";
import type { Position } from "@/lib/positions";
import {
  buildSchemaForQuestionSet,
  defaultValuesForQuestionSet,
} from "@/lib/schema";
import { submitApplication } from "@/app/apply/[slug]/actions";
import { cn } from "@/lib/utils";

interface Props {
  position: Position;
  questionSet: QuestionSet;
}

export function ApplicationForm({ position, questionSet }: Props) {
  const schema = useMemo(
    () => buildSchemaForQuestionSet(questionSet),
    [questionSet]
  );
  const defaultValues = useMemo(
    () => defaultValuesForQuestionSet(questionSet),
    [questionSet]
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });

  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const router = useRouter();

  const totalSteps = questionSet.sections.length;
  const currentSection = questionSet.sections[step];
  const progress = ((step + 1) / totalSteps) * 100;

  async function goNext() {
    const fieldIds = currentSection.fields.map((f) => f.id);
    const valid = await form.trigger(fieldIds as never);
    if (!valid) {
      toast.error("Please complete the required fields on this page.");
      return;
    }
    if (step < totalSteps - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goPrev() {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function onSubmit(data: Record<string, unknown>) {
    startTransition(async () => {
      const result = await submitApplication(position.slug, data);
      if (result.ok) {
        setSubmitted(true);
        setSubmissionId(result.submissionId ?? null);
        toast.success("Your application has been submitted. Jazak Allahu khayran.");
      } else {
        if (result.fieldErrors) {
          for (const [key, msg] of Object.entries(result.fieldErrors)) {
            form.setError(key as never, { message: msg });
          }
          // Jump to the first invalid section
          for (let i = 0; i < questionSet.sections.length; i++) {
            const section = questionSet.sections[i];
            const hasError = section.fields.some(
              (f) => result.fieldErrors && result.fieldErrors[f.id]
            );
            if (hasError) {
              setStep(i);
              break;
            }
          }
        }
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (submitted) {
    return <SuccessState position={position} submissionId={submissionId} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress header */}
      <div className="mb-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-ink/60 mb-3">
          <span>
            Step {step + 1} of {totalSteps}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-cream-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-deep via-emerald-rich to-gold-warm"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {questionSet.sections.map((section, i) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                // allow navigation to any previous step
                if (i < step) setStep(i);
              }}
              className={cn(
                "text-xs px-3 py-1 rounded-full transition",
                i === step
                  ? "bg-emerald-deep text-cream font-medium"
                  : i < step
                  ? "bg-emerald-deep/10 text-emerald-deep hover:bg-emerald-deep/20 cursor-pointer"
                  : "bg-cream-muted text-ink/40 cursor-default"
              )}
              disabled={i > step}
            >
              {i + 1}. {section.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <SectionView
              section={currentSection}
              form={form}
              errors={form.formState.errors}
            />
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-cream-muted">
          <div>
            {step > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="btn-ghost"
                disabled={isPending}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step < totalSteps - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn-primary group"
                disabled={isPending}
              >
                Next
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary group"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Application
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Cancel link */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => router.push("/positions")}
          className="text-xs text-ink/50 hover:text-ink underline underline-offset-4"
        >
          Cancel and go back to positions
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------

function SectionView({
  section,
  form,
  errors,
}: {
  section: Section;
  form: ReturnType<typeof useForm>;
  errors: FieldErrors;
}) {
  return (
    <div className="space-y-8">
      <div>
        {section.arabicTitle && (
          <p className="arabic-text text-gold-antique mb-1">
            {section.arabicTitle}
          </p>
        )}
        <h2 className="heading-serif text-3xl font-semibold text-emerald-deep">
          {section.title}
        </h2>
        {section.description && (
          <p className="mt-2 text-sm text-ink/65 leading-relaxed max-w-prose">
            {section.description}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {section.fields.map((field) => (
          <FieldView
            key={field.id}
            field={field}
            form={form}
            error={errors[field.id]?.message as string | undefined}
          />
        ))}
      </div>
    </div>
  );
}

function FieldView({
  field,
  form,
  error,
}: {
  field: Field;
  form: ReturnType<typeof useForm>;
  error?: string;
}) {
  const { register, control } = form;

  return (
    <div>
      <label htmlFor={field.id} className="label-field">
        {field.label}
        {field.required && (
          <span className="text-gold-antique ml-1" aria-hidden>
            *
          </span>
        )}
      </label>

      {field.type === "textarea" && (
        <textarea
          id={field.id}
          rows={5}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={cn("textarea-field", error && "border-red-400")}
          {...register(field.id)}
        />
      )}

      {(field.type === "text" ||
        field.type === "email" ||
        field.type === "tel" ||
        field.type === "number" ||
        field.type === "date" ||
        field.type === "url") && (
        <input
          id={field.id}
          type={field.type}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          minLength={field.minLength}
          maxLength={field.maxLength}
          className={cn("input-field", error && "border-red-400")}
          {...register(field.id)}
        />
      )}

      {field.type === "select" && (
        <select
          id={field.id}
          className={cn("input-field appearance-none bg-white pr-10", error && "border-red-400")}
          {...register(field.id)}
          defaultValue=""
        >
          <option value="" disabled>
            Choose an option…
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {field.type === "radio" && field.options && (
        <Controller
          control={control}
          name={field.id}
          render={({ field: ctrl }) => (
            <div className="space-y-2.5">
              {field.options!.map((opt) => {
                const checked = ctrl.value === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      checked
                        ? "bg-emerald-deep/5 border-emerald-deep/40 shadow-sm"
                        : "bg-white border-cream-muted hover:border-emerald-deep/20 hover:bg-cream-warm/30"
                    )}
                  >
                    <input
                      type="radio"
                      name={field.id}
                      value={opt.value}
                      checked={checked}
                      onChange={() => ctrl.onChange(opt.value)}
                      onBlur={ctrl.onBlur}
                      className="mt-1 accent-emerald-deep"
                    />
                    <span className="text-sm text-ink/85 leading-relaxed flex-1">
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        />
      )}

      {field.type === "checkbox" && field.options && (
        <Controller
          control={control}
          name={field.id}
          render={({ field: ctrl }) => {
            const selected: string[] = Array.isArray(ctrl.value)
              ? (ctrl.value as string[])
              : [];
            return (
              <div className="space-y-2.5">
                {field.options!.map((opt) => {
                  const checked = selected.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                        checked
                          ? "bg-emerald-deep/5 border-emerald-deep/40 shadow-sm"
                          : "bg-white border-cream-muted hover:border-emerald-deep/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            ctrl.onChange([...selected, opt.value]);
                          } else {
                            ctrl.onChange(selected.filter((v) => v !== opt.value));
                          }
                        }}
                        onBlur={ctrl.onBlur}
                        className="mt-1 accent-emerald-deep"
                      />
                      <span className="text-sm text-ink/85 leading-relaxed flex-1">
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          }}
        />
      )}

      {field.help && <p className="help-text">{field.help}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

// --------------------------------------------------------------------

function SuccessState({
  position,
  submissionId,
}: {
  position: Position;
  submissionId: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="relative mx-auto w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-rich/20 animate-ping" />
        <div className="relative h-20 w-20 rounded-full bg-emerald-gradient flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-cream" />
        </div>
      </div>
      <div className="arabic-text text-2xl text-gold-antique mb-2">
        جزاك الله خيراً
      </div>
      <h2 className="heading-serif text-4xl font-semibold text-emerald-deep">
        Application received
      </h2>
      <div className="gold-divider" />
      <p className="mt-4 text-lg text-ink/70 leading-relaxed">
        Your application for{" "}
        <span className="font-semibold text-emerald-deep">{position.title}</span>{" "}
        has been submitted. May Allah reward your intention whether you are
        selected or not.
      </p>
      <p className="mt-4 text-sm text-ink/60">
        The Advisor will review and reach out via the contact details you
        provided. References will be contacted only with your permission.
      </p>
      {submissionId && (
        <p className="mt-6 text-xs text-ink/50">
          Submission reference:{" "}
          <code className="px-2 py-1 rounded bg-cream-muted text-ink/70 font-mono">
            {submissionId}
          </code>
        </p>
      )}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          Return home
        </Link>
        <Link href="/positions" className="btn-ghost">
          View other positions
        </Link>
      </div>
    </motion.div>
  );
}
