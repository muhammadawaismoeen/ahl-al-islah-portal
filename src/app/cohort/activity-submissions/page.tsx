import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  UserX,
  CalendarDays,
  Clock,
  LogOut,
  Users,
  MessageSquareHeart,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { getHeadRole, logoutHead } from "@/app/cohort/actions";
import {
  listSubmissions,
  PILLAR_TYPE_LABELS,
} from "@/lib/activity-submissions-store";
import type {
  IdentityPillarsSubmission,
  IdentityPillar,
} from "@/lib/activity-submissions-types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Identity Pillars Audits — Cohort Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  unread: { label: "Unread", className: "bg-gold-antique text-white" },
  read: { label: "Read", className: "bg-ink/20 text-ink/70" },
};

export default async function CohortActivitySubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const role = await getHeadRole();
  const content = await getContent();

  if (!role) redirect("/cohort");
  if (role !== "female") redirect("/cohort");

  const entries = await listSubmissions();
  const { id: selectedId } = await searchParams;
  const selected = selectedId
    ? entries.find((e) => e.id === selectedId)
    : null;
  const unreadCount = entries.filter((e) => e.status === "unread").length;

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
              Applications
            </Link>
            <Link
              href="/cohort/feedback"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-ink/60 hover:text-emerald-deep transition border-b-2 border-transparent"
            >
              <MessageSquareHeart className="h-3.5 w-3.5" />
              Feedback
            </Link>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-emerald-deep font-medium border-b-2 border-emerald-deep">
              <ClipboardList className="h-3.5 w-3.5" />
              Identity Pillars Audits
            </span>
          </div>

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <Link
                href="/cohort"
                className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-2 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
              </Link>
              <span className="arabic-text block text-gold-antique">
                ركائز الهوية
              </span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Identity Pillars Audits
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {entries.length} submission{entries.length !== 1 ? "s" : ""}
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-gold-antique text-white text-xs font-medium">
                    {unreadCount} unread
                  </span>
                )}
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-deep/10 text-emerald-deep text-[10px] font-medium uppercase tracking-wider">
                  Read-only
                </span>
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

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6">
            {/* List */}
            <div className="ornate-card p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {entries.length === 0 ? (
                <div className="p-10 text-center">
                  <ClipboardList className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                  <p className="text-sm text-ink/60">
                    No audits submitted yet.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-cream-muted">
                  {entries.map((entry) => {
                    const status = STATUS_CONFIG[entry.status];
                    const isSelected = entry.id === selectedId;
                    const displayName = entry.name?.trim() || "Anonymous";
                    const isAnonymous = !entry.name?.trim();
                    return (
                      <li key={entry.id}>
                        <Link
                          href={`/cohort/activity-submissions?id=${entry.id}`}
                          className={`block p-4 rounded-xl transition ${
                            isSelected
                              ? "bg-emerald-deep/5"
                              : "hover:bg-cream-warm/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span
                              className={`font-medium text-sm truncate flex items-center gap-1.5 ${
                                entry.status === "unread"
                                  ? "text-ink"
                                  : "text-ink/70"
                              }`}
                            >
                              {isAnonymous && (
                                <UserX className="h-3.5 w-3.5 text-ink/40 shrink-0" />
                              )}
                              {displayName}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          {entry.sessionTitle ? (
                            <p className="text-[11px] text-emerald-deep/70 mb-1 truncate flex items-center gap-1">
                              <CalendarDays className="h-3 w-3 shrink-0" />
                              {entry.sessionTitle}
                            </p>
                          ) : (
                            <p className="text-[11px] text-ink/35 italic mb-1">
                              No session link
                            </p>
                          )}
                          <p className="text-xs text-ink/60 truncate">
                            {entry.pillar1.text || "—"}
                          </p>
                          <p className="text-[11px] text-ink/40 mt-1">
                            {formatDate(entry.submittedAt)}
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
                <SubmissionDetail entry={selected} />
              ) : (
                <div className="h-full flex items-center justify-center py-20 text-center">
                  <div>
                    <ClipboardList className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                    <p className="text-sm text-ink/60">
                      Select an audit to view it.
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

function SubmissionDetail({ entry }: { entry: IdentityPillarsSubmission }) {
  const status = STATUS_CONFIG[entry.status];
  const isAnonymous = !entry.name?.trim();
  const displayName = entry.name?.trim() || "Anonymous respondent";

  const counts = [entry.pillar1, entry.pillar2, entry.pillar3].reduce(
    (acc, p) => {
      if (p.type === "A") acc.A++;
      else if (p.type === "B") acc.B++;
      return acc;
    },
    { A: 0, B: 0 }
  );

  return (
    <article className="space-y-6">
      <header className="pb-5 border-b border-cream-muted">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${status.className}`}
            >
              {status.label}
            </span>
            <h2 className="heading-serif text-2xl font-semibold text-emerald-deep leading-tight flex items-center gap-2">
              {isAnonymous && <UserX className="h-5 w-5 text-ink/40" />}
              {displayName}
            </h2>
            {isAnonymous && (
              <p className="text-xs text-ink/50 italic mt-1">
                The respondent chose to stay anonymous.
              </p>
            )}
          </div>
        </div>

        {entry.sessionTitle && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-gold-antique/10 rounded-xl border border-gold-antique/25">
            <CalendarDays className="h-4 w-4 text-gold-antique shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink/45 leading-none mb-0.5">
                Session
              </p>
              <p className="text-sm font-medium text-emerald-deep leading-tight">
                {entry.sessionTitle}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-deep/10 border border-emerald-deep/20 text-emerald-deep font-medium">
            {counts.A} Allah-grounded (A)
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-gold-antique/10 border border-gold-antique/30 text-gold-antique font-medium">
            {counts.B} Approval-grounded (B)
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-xs text-ink/40">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(entry.submittedAt)}
          {" · "}
          <code className="font-mono text-[10px] bg-cream-muted px-1.5 py-0.5 rounded">
            {entry.id}
          </code>
        </div>
      </header>

      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-gold-antique font-semibold">
          Their Three Pillars
        </h3>
        <PillarDisplay number={1} pillar={entry.pillar1} />
        <PillarDisplay number={2} pillar={entry.pillar2} />
        <PillarDisplay number={3} pillar={entry.pillar3} />
      </section>

      {entry.reflection && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-gold-antique font-semibold mb-3">
            One Honest Sentence
          </h3>
          <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap bg-cream-warm rounded-xl p-4 border border-cream-muted">
            {entry.reflection}
          </p>
        </section>
      )}
    </article>
  );
}

function PillarDisplay({
  number,
  pillar,
}: {
  number: number;
  pillar: IdentityPillar;
}) {
  const isA = pillar.type === "A";
  const isB = pillar.type === "B";
  const typeLabel = pillar.type
    ? PILLAR_TYPE_LABELS[pillar.type]
    : "Unclassified";
  return (
    <div
      className={`rounded-xl p-4 border ${
        isA
          ? "border-emerald-deep/25 bg-emerald-deep/5"
          : isB
          ? "border-gold-antique/30 bg-gold-antique/5"
          : "border-cream-muted bg-cream-warm/40"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[10px] uppercase tracking-widest text-ink/55 font-medium">
          Pillar {number}
        </span>
        {pillar.type && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isA
                ? "bg-emerald-deep text-white"
                : "bg-gold-antique/15 text-gold-antique"
            }`}
          >
            {pillar.type} · {typeLabel}
          </span>
        )}
      </div>
      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
        {pillar.text || (
          <span className="text-ink/30 italic">— empty —</span>
        )}
      </p>
    </div>
  );
}
