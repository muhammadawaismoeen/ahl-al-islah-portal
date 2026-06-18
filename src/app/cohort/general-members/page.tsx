import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  Users,
  UserPlus,
  MessageSquareHeart,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { getHeadRole, logoutHead } from "@/app/cohort/actions";
import { listSubmissions } from "@/lib/storage";
import { getPositionBySlug } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ahl Al-Islah Membership — Cohort Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const WING_CONFIG = {
  male: {
    label: "Brothers' Cohort",
    arabic: "جناح الإخوة",
    badge: "bg-emerald-deep/10 text-emerald-deep",
  },
  female: {
    label: "Sisters' Cohort",
    arabic: "جناح الأخوات",
    badge: "bg-gold-antique/10 text-gold-antique",
  },
} as const;

const COHORT_VISIBLE_FROM = "2026-04-26";

export default async function CohortGeneralMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const role = await getHeadRole();
  const content = await getContent();

  if (!role) redirect("/cohort");

  const wing: "male" | "female" =
    role === "male" || role === "male-core" || role === "deputy-male"
      ? "male"
      : "female";

  const wingConfig = WING_CONFIG[wing];
  const allSubmissions = await listSubmissions();

  const submissions = allSubmissions
    .filter((s) => {
      if (!s.positionSlug.startsWith("general-member")) return false;
      if (s.wing !== wing) return false;
      return s.submittedAt.slice(0, 10) >= COHORT_VISIBLE_FROM;
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const { id: selectedId } = await searchParams;
  const selected = selectedId
    ? submissions.find((s) => s.id === selectedId)
    : null;

  const showFeedbackTabs = role === "female";

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-28 pb-20">
        <div className="container-prose">
          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2 border-b border-cream-muted">
            <Link
              href="/cohort"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-ink/60 hover:text-emerald-deep transition border-b-2 border-transparent"
            >
              <Users className="h-3.5 w-3.5" />
              Membership applicants
            </Link>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-emerald-deep font-medium border-b-2 border-emerald-deep">
              <UserPlus className="h-3.5 w-3.5" />
              Ahl Al-Islah Membership
            </span>
            {showFeedbackTabs && (
              <>
                <Link
                  href="/cohort/feedback"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-ink/60 hover:text-emerald-deep transition border-b-2 border-transparent"
                >
                  <MessageSquareHeart className="h-3.5 w-3.5" />
                  Feedback
                </Link>
                <Link
                  href="/cohort/activity-submissions"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-ink/60 hover:text-emerald-deep transition border-b-2 border-transparent"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Identity Pillars Audits
                </Link>
              </>
            )}
          </div>

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <Link
                href="/cohort"
                className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-2 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Membership applicants
              </Link>
              <span className="arabic-text text-gold-antique">
                {wingConfig.arabic}
              </span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Ahl Al-Islah Membership · {wingConfig.label}
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {submissions.length} general-member application
                {submissions.length === 1 ? "" : "s"}
              </p>
            </div>
            <form action={logoutHead}>
              <button type="submit" className="btn-secondary !py-2 !px-4 text-xs">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            {/* List */}
            <div className="ornate-card p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {submissions.length === 0 ? (
                <div className="p-10 text-center">
                  <UserPlus className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                  <p className="text-sm text-ink/60">
                    No general-member applications yet.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-cream-muted">
                  {submissions.map((s) => {
                    const position = getPositionBySlug(s.positionSlug);
                    const name =
                      (s.data.fullName as string) ??
                      (s.data.name as string) ??
                      "Unnamed";
                    const isSelected = s.id === selectedId;
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/cohort/general-members?id=${s.id}`}
                          className={`block p-4 rounded-xl transition ${
                            isSelected
                              ? "bg-emerald-deep/5"
                              : "hover:bg-cream-warm/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <span className="font-medium text-ink truncate">
                              {name}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${wingConfig.badge}`}
                            >
                              {s.wing === "male" ? "Brother" : "Sister"}
                            </span>
                          </div>
                          <p className="text-xs text-ink/60 truncate">
                            {position?.title ?? s.positionTitle}
                          </p>
                          <p className="text-[11px] text-ink/40 mt-1">
                            {formatDate(s.submittedAt)}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Detail */}
            <div className="ornate-card p-6 sm:p-8">
              {selected ? (
                <ApplicationDetail submission={selected} />
              ) : (
                <div className="h-full flex items-center justify-center py-20 text-center">
                  <div>
                    <UserPlus className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                    <p className="text-sm text-ink/60">
                      Select an application to review it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
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

type Submission = Awaited<ReturnType<typeof listSubmissions>>[number];

function ApplicationDetail({ submission }: { submission: Submission }) {
  const position = getPositionBySlug(submission.positionSlug);
  const qs = position ? getQuestionSet(position.questionSet) : null;
  const data = submission.data as Record<string, unknown>;

  const email = (data.email as string) ?? "";
  const phone = (data.phone as string) ?? "";

  const jsonString = JSON.stringify(submission, null, 2);
  const downloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

  return (
    <article>
      <header className="pb-6 border-b border-cream-muted">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold-antique">
              {position?.title ?? submission.positionTitle}
            </div>
            <h2 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">
              {(data.fullName as string) ?? "Unnamed applicant"}
            </h2>
            <p className="text-xs text-ink/50 mt-1">
              Submitted {formatDate(submission.submittedAt)} · Ref{" "}
              <code className="font-mono bg-cream-muted px-1.5 py-0.5 rounded text-[10px]">
                {submission.id}
              </code>
            </p>
          </div>
          <a
            href={downloadHref}
            download={`${submission.id}.json`}
            className="btn-ghost !py-1.5 !px-3 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </a>
        </div>

        {(email || phone) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 text-emerald-deep hover:underline"
              >
                <Mail className="h-3.5 w-3.5" /> {email}
              </a>
            )}
            {phone && (
              <a
                href={`https://wa.me/${phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-deep hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
            )}
          </div>
        )}
      </header>

      <div className="mt-6 space-y-8">
        {qs ? (
          qs.sections.map((section) => (
            <section key={section.id}>
              <h3 className="heading-serif text-lg font-semibold text-emerald-deep mb-3 pb-2 border-b border-cream-muted">
                {section.title}
              </h3>
              <dl className="space-y-4">
                {section.fields.map((field) => {
                  const value = data[field.id];
                  const display = formatDisplay(value, field);
                  return (
                    <div key={field.id}>
                      <dt className="text-xs uppercase tracking-wider text-ink/50 font-medium mb-1">
                        {field.label}
                      </dt>
                      <dd className="text-sm text-ink/85 whitespace-pre-wrap leading-relaxed">
                        {display || (
                          <span className="text-ink/30 italic">— empty —</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))
        ) : (
          <pre className="p-4 rounded-lg bg-cream-muted text-xs overflow-x-auto">
            {jsonString}
          </pre>
        )}
      </div>
    </article>
  );
}

function formatDisplay(
  value: unknown,
  field: { options?: { label: string; value: string }[] }
): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        const found = field.options?.find((o) => o.value === v);
        return found ? found.label : String(v);
      })
      .join(", ");
  }
  const found = field.options?.find((o) => o.value === value);
  return found ? found.label : String(value);
}
