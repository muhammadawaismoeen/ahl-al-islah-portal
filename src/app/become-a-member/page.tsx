import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApplicationForm } from "@/components/ApplicationForm";
import { getPositionBySlug } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import type { QuestionSet } from "@/lib/questions";
import { getContent } from "@/lib/content-store";
import type { FormQuestionSet } from "@/lib/content-types";

export const metadata: Metadata = {
  title: "Become a Member — Ahl Al-Islah",
  description:
    "Join the Ahl Al-Islah community. Show up to sessions, stay on cohort updates, grow with the team. Open to all HSE students.",
};

export const dynamic = "force-dynamic";

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

export default async function BecomeAMemberPage() {
  const position = getPositionBySlug("general-member");
  if (!position) notFound();

  const content = await getContent();
  const dynamicConfig = content.formConfig?.["general-member"];

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
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-28 pb-20">
        <div className="container-prose max-w-3xl mx-auto">
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-deep/10 border border-emerald-deep/20 text-xs font-medium text-emerald-deep tracking-wider uppercase mb-6">
              <Heart className="h-3.5 w-3.5" />
              Open to all HSE students
            </div>
            <p className="arabic-text text-3xl text-gold-antique mb-3">
              انضم إلينا
            </p>
            <h1 className="heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
              Become a Member
            </h1>
            <div className="gold-divider" />
            <p className="mt-4 text-lg text-ink/70 leading-relaxed max-w-xl mx-auto">
              Sign up to be part of the Ahl Al-Islah community. Show up to
              sessions, stay on our cohort updates, and grow alongside the
              team. No leadership commitment required.
            </p>
            <p className="mt-3 text-sm text-ink/55 max-w-xl mx-auto">
              Looking to take on a leadership role?{" "}
              <Link
                href="/join"
                className="text-emerald-deep underline underline-offset-2 hover:text-emerald-rich transition"
              >
                Join as Core Member
              </Link>{" "}
              instead.
            </p>
          </header>

          <ApplicationForm
            position={position}
            questionSet={questionSet}
            cancelHref="/"
            cancelLabel="Cancel and return home"
            successToast="Welcome to Ahl Al-Islah. We'll be in touch soon."
            successHeading="Welcome to Ahl Al-Islah"
            successDescription={
              <>
                <p className="text-lg text-ink/70 leading-relaxed">
                  Your sign-up has been received. You will start receiving
                  session reminders and cohort updates over WhatsApp
                  in&nbsp;sha&apos;&nbsp;Allah.
                </p>
                <p className="mt-4 text-sm text-ink/60">
                  Your Cohort Head will reach out shortly to welcome you and
                  point you to the next gathering.
                </p>
              </>
            }
            successSecondaryLink={{
              href: "/sessions",
              label: "Browse upcoming sessions",
            }}
          />
        </div>
      </main>
      <Footer
        content={content.footer}
        navContent={content.nav}
        customLogo={content.customLogo}
      />
    </>
  );
}
