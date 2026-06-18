import type { Metadata } from "next";
import Link from "next/link";
import {
  LogOut,
  Download,
  Mail,
  Phone,
  Users,
  MessageSquareHeart,
  ClipboardList,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { getHeadRole, logoutHead } from "./actions";
import { CohortLoginForm } from "./LoginForm";
import { listSubmissions } from "@/lib/storage";
import { getPositionBySlug } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cohort Portal — Ahl Al-Islah",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const WING_CONFIG = {
  male: {
    label: "Brothers' Cohort",
    arabic: "جناح الإخوة",
    dot: "bg-emerald-deep",
    badge: "bg-emerald-deep/10 text-emerald-deep",
    accent: "bg-emerald-deep text-white",
    hover: "hover:bg-emerald-deep/10 hover:text-emerald-deep",
  },
  female: {
    label: "Sisters' Cohort",
    arabic: "جناح الأخوات",
    dot: "bg-gold-antique",
    badge: "bg-gold-antique/10 text-gold-antique",
    accent: "bg-gold-antique text-white",
    hover: "hover:bg-gold-antique/10 hover:text-gold-antique",
  },
  "male-core": {
    label: "Brothers' Cohort",
    arabic: "أعضاء الإخوة",
    dot: "bg-emerald-deep",
    badge: "bg-emerald-deep/10 text-emerald-deep",
    accent: "bg-emerald-deep text-white",
    hover: "hover:bg-emerald-deep/10 hover:text-emerald-deep",
  },
  "deputy-male": {
    label: "Brothers' Cohort · Deputy View",
    arabic: "نائب رئيس الإخوة",
    dot: "bg-emerald-deep",
    badge: "bg-emerald-deep/10 text-emerald-deep",
    accent: "bg-emerald-deep text-white",
    hover: "hover:bg-emerald-deep/10 hover:text-emerald-deep",
  },
  "deputy-female": {
    label: "Sisters' Cohort · Deputy View",
    arabic: "نائبة رئيسة الأخوات",
    dot: "bg-gold-antique",
    badge: "bg-gold-antique/10 text-gold-antique",
    accent: "bg-gold-antique text-white",
    hover: "hover:bg-gold-antique/10 hover:text-gold-antique",
  },
} as const;

const isHeadSlug = (slug: string) =>
  slug === "male-head" || slug === "female-head";
const isCoreSlug = (slug: string) =>
  slug === "core-member-male" || slug === "core-member-female";
const isGeneralSlug = (slug: string) => slug.startsWith("general-member");

type PositionFilter = "all" | "core" | "general";

export default async function CohortPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; position?: string }>;
}) {
  const content = await getContent();
  const role = await getHeadRole();

  /* ── Not logged in ───────────────────────────────────────────── */
  if (!role) {
    return (
      <>
        <Navbar content={content.nav} customLogo={content.customLogo} />
        <main className="pt-32 pb-20">
          <div className="container-prose max-w-md mx-auto">
            <div className="ornate-card p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-deep/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-emerald-deep" />
                </div>
                <span className="arabic-text text-gold-antique block mb-1">
                  بوابة الرأس
                </span>
                <h1 className="heading-serif text-3xl font-semibold text-emerald-deep">
                  Cohort Portal
                </h1>
                <p className="text-sm text-ink/60 mt-2">
                  Sign in with the credentials provided by the Advisor.
                </p>
              </div>
              <CohortLoginForm />
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

  /* ── Authenticated ───────────────────────────────────────────── */
  const wing = WING_CONFIG[role];
  const allSubmissions = await listSubmissions();

  // Role scoping:
  //   - "male"           → Brothers' Cohort (Core + General)
  //   - "female"         → Sisters'  Cohort (Core + General)
  //   - "male-core"      → Brothers' Cohort (Core + General, no deputy exclusions)
  //   - "deputy-male"    → Brothers' Cohort; deputy exclusions applied to Core only
  //   - "deputy-female"  → Sisters'  Cohort; deputy exclusions applied to Core only
  // Heads are always admin-only — never shown in the cohort portal.
  const COHORT_VISIBLE_FROM = "2026-04-26";

  const wingFilter: "male" | "female" =
    role === "male" || role === "male-core" || role === "deputy-male"
      ? "male"
      : "female";

  // Name fragments to exclude for deputy roles — applied to Core Members only
  // (keeps the deputy from seeing the Head's core app and their own).
  const DEPUTY_EXCLUSIONS: Record<"deputy-male" | "deputy-female", string[]> = {
    "deputy-male": ["ammar amjad", "muhammad ahmed"],
    "deputy-female": ["hajrah noor", "syeda fatima bukhari"],
  };
  const excludedFragments =
    role === "deputy-male" || role === "deputy-female"
      ? DEPUTY_EXCLUSIONS[role]
      : null;

  const normaliseName = (s: Submission) =>
    (((s.data.fullName as string) ?? (s.data.name as string) ?? "") + "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const { id: selectedId, position: positionParam } = await searchParams;
  const positionFilter: PositionFilter =
    positionParam === "core"
      ? "core"
      : positionParam === "general"
      ? "general"
      : "all";

  // Apply wing + visibility-window + head-exclusion once.
  const wingScopedAll = allSubmissions.filter((s) => {
    if (s.wing !== wingFilter) return false;
    if (isHeadSlug(s.positionSlug)) return false;
    if (s.submittedAt.slice(0, 10) < COHORT_VISIBLE_FROM) return false;
    return true;
  });

  // Deputy exclusions apply ONLY to Core. General Members are never name-filtered.
  const passesDeputyExclusion = (s: Submission) => {
    if (!excludedFragments) return true;
    if (!isCoreSlug(s.positionSlug)) return true;
    const name = normaliseName(s);
    return !excludedFragments.some((frag) => name.includes(frag));
  };

  const visibleSubmissions = wingScopedAll
    .filter(passesDeputyExclusion)
    .filter((s) => {
      if (positionFilter === "core") return isCoreSlug(s.positionSlug);
      if (positionFilter === "general") return isGeneralSlug(s.positionSlug);
      return true;
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  // Counts (post-deputy-exclusion, wing-scoped) for sub-pill labels
  const wingScopedVisible = wingScopedAll.filter(passesDeputyExclusion);
  const countAll = wingScopedVisible.length;
  const countCore = wingScopedVisible.filter((s) => isCoreSlug(s.positionSlug)).length;
  const countGeneral = wingScopedVisible.filter((s) => isGeneralSlug(s.positionSlug)).length;

  const selected = selectedId
    ? wingScopedAll.find((s) => s.id === selectedId)
    : null;

  function filterUrl(nextPosition: PositionFilter) {
    const q = new URLSearchParams();
    if (nextPosition !== "all") q.set("position", nextPosition);
    const s = q.toString();
    return `/cohort${s ? `?${s}` : ""}`;
  }

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-28 pb-20">
        <div className="container-prose">

          {/* Tabs — every role sees Membership applicants; female head also sees Feedback + Audits */}
          <div className="mb-6 flex flex-wrap gap-2 border-b border-cream-muted">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-emerald-deep font-medium border-b-2 border-emerald-deep">
              <Users className="h-3.5 w-3.5" />
              Membership applicants
            </span>
            {role === "female" && (
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
              <span className="arabic-text text-gold-antique">{wing.arabic}</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                {wing.label}
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {visibleSubmissions.length} of {countAll} application
                {countAll === 1 ? "" : "s"}
              </p>
            </div>
            <form action={logoutHead}>
              <button
                type="submit"
                className="btn-secondary !py-2 !px-4 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>

          {/* Position filter — Core / General sub-pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href={filterUrl("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                positionFilter === "all"
                  ? wing.accent
                  : `bg-cream-muted text-ink/60 ${wing.hover}`
              }`}
            >
              All ({countAll})
            </Link>
            <Link
              href={filterUrl("core")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                positionFilter === "core"
                  ? wing.accent
                  : `bg-cream-muted text-ink/60 ${wing.hover}`
              }`}
            >
              Core Members ({countCore})
            </Link>
            <Link
              href={filterUrl("general")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                positionFilter === "general"
                  ? wing.accent
                  : `bg-cream-muted text-ink/60 ${wing.hover}`
              }`}
            >
              General Members ({countGeneral})
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            {/* Application list */}
            <div className="ornate-card p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {visibleSubmissions.length === 0 ? (
                <div className="p-10 text-center">
                  <Users className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                  <p className="text-sm text-ink/60">No applications yet.</p>
                  <p className="text-xs text-ink/40 mt-1">
                    Check back after recruitment opens.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-cream-muted">
                  {visibleSubmissions.map((s) => {
                    const position = getPositionBySlug(s.positionSlug);
                    const name =
                      (s.data.fullName as string) ??
                      (s.data.name as string) ??
                      "Unnamed";
                    const isSelected = s.id === selectedId;
                    const selectionParams = new URLSearchParams();
                    selectionParams.set("id", s.id);
                    if (positionFilter !== "all")
                      selectionParams.set("position", positionFilter);
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/cohort?${selectionParams.toString()}`}
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
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${wing.badge}`}
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

            {/* Detail panel */}
            <div className="ornate-card p-6 sm:p-8">
              {selected ? (
                <ApplicationDetail submission={selected} />
              ) : (
                <div className="h-full flex items-center justify-center py-20 text-center">
                  <div>
                    <Users className="h-10 w-10 text-ink/20 mx-auto mb-3" />
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

/* ── Application detail ──────────────────────────────────────── */

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
