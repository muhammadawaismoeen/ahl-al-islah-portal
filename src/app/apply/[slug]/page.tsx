import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApplicationForm } from "@/components/ApplicationForm";
import { getAllPositions, getPositionBySlug } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import type { QuestionSet } from "@/lib/questions";
import { getContent } from "@/lib/content-store";
import type { FormQuestionSet } from "@/lib/content-types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPositions().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const position = getPositionBySlug(slug);
  if (!position) return { title: "Position not found" };
  return {
    title: `Apply — ${position.title}`,
    description: position.summary,
  };
}

/**
 * Convert a stored FormQuestionSet (from content editor) to the
 * QuestionSet shape that ApplicationForm and the schema builder expect.
 */
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

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const position = getPositionBySlug(slug);
  if (!position) notFound();

  // Try dynamic form config from content store first, fall back to static
  const content = await getContent();
  const dynamicConfig = content.formConfig?.[slug];

  let questionSet: QuestionSet;
  if (dynamicConfig && dynamicConfig.sections.length > 0) {
    questionSet = formConfigToQuestionSet(dynamicConfig);
  } else {
    const staticQs = getQuestionSet(position.questionSet);
    if (!staticQs) {
      throw new Error(`Question set not found: ${position.questionSet}`);
    }
    questionSet = staticQs;
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose">
          <Link
            href="/positions"
            className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-emerald-deep transition mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to positions
          </Link>

          {/* Position summary header */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="ornate-card p-6 sm:p-8 bg-gradient-to-br from-white to-cream-warm/40">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {position.arabicTitle && (
                    <p className="arabic-text text-lg text-gold-antique mb-1">
                      {position.arabicTitle}
                    </p>
                  )}
                  <h1 className="heading-serif text-3xl sm:text-4xl font-semibold text-emerald-deep">
                    {position.title}
                  </h1>
                </div>
                {!position.open && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink/5 text-ink/60 text-xs font-medium">
                    Applications closed
                  </span>
                )}
              </div>

              <p className="mt-4 text-ink/70 leading-relaxed">
                {position.summary}
              </p>

              <div className="mt-6 grid sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-cream-muted">
                  <Users className="h-4 w-4 text-gold-antique shrink-0" />
                  <div>
                    <div className="text-ink/50 uppercase tracking-wider text-[10px]">
                      Reports to
                    </div>
                    <div className="text-ink/80 font-medium">
                      {position.reportsTo}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-cream-muted">
                  <Clock className="h-4 w-4 text-gold-antique shrink-0" />
                  <div>
                    <div className="text-ink/50 uppercase tracking-wider text-[10px]">
                      Commitment
                    </div>
                    <div className="text-ink/80 font-medium">
                      {position.commitment}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-cream-muted">
                  <CalendarClock className="h-4 w-4 text-gold-antique shrink-0" />
                  <div>
                    <div className="text-ink/50 uppercase tracking-wider text-[10px]">
                      Term
                    </div>
                    <div className="text-ink/80 font-medium">
                      {position.termLength}
                    </div>
                  </div>
                </div>
              </div>

              <details className="mt-6 group">
                <summary className="cursor-pointer text-sm font-medium text-emerald-deep hover:text-emerald-rich transition list-none flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-deep/10 flex items-center justify-center text-xs group-open:rotate-45 transition-transform">
                    +
                  </span>
                  View full responsibilities &amp; ideal profile
                </summary>
                <div className="mt-4 grid sm:grid-cols-2 gap-6 pt-4 border-t border-cream-muted">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-gold-antique font-medium mb-3">
                      Responsibilities
                    </h4>
                    <ul className="space-y-2 text-sm text-ink/75">
                      {position.responsibilities.map((r) => (
                        <li key={r} className="flex gap-2">
                          <span className="text-gold-antique shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-gold-antique font-medium mb-3">
                      Ideal Profile
                    </h4>
                    <ul className="space-y-2 text-sm text-ink/75">
                      {position.idealProfile.map((r) => (
                        <li key={r} className="flex gap-2">
                          <span className="text-gold-antique shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {position.open ? (
            <ApplicationForm position={position} questionSet={questionSet} />
          ) : (
            <div className="max-w-2xl mx-auto text-center p-10 rounded-2xl bg-cream-warm border border-cream-muted">
              <h2 className="heading-serif text-2xl font-semibold text-ink/70">
                Applications are currently closed for this role
              </h2>
              <p className="mt-3 text-sm text-ink/60">
                Check back later or explore other open positions.
              </p>
              <Link href="/positions" className="btn-primary mt-6 inline-flex">
                Browse positions
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
