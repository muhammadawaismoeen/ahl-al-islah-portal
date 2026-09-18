import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  Clock,
  MessageSquareHeart,
  UserX,
  Star,
  HelpCircle,
  Quote,
  CalendarDays,
  Target,
  AlertTriangle,
} from "lucide-react";
import { isAuthenticated } from "@/app/admin/actions";
import {
  listFeedback,
  RESPONSE_CHANNEL_LABELS,
  RATING_LABELS,
} from "@/lib/feedback-store";
import type { FeedbackEntry } from "@/lib/feedback-types";
import { listSessions } from "@/lib/sessions-store";
import { formatDate } from "@/lib/utils";
import { DeleteFeedbackButton, MarkFeedbackReadButton } from "./FeedbackActions";
import { SessionFilter } from "./SessionFilter";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

export const metadata: Metadata = {
  title: "Feedback Inbox — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  unread: { label: "Unread", className: "bg-amber text-white" },
  read: { label: "Read", className: "bg-ink/20 text-ink/70" },
};

export default async function FeedbackAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; session?: string }>;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return <AdminLoginScreen />;
  }

  const [allEntries, sessions] = await Promise.all([
    listFeedback(),
    listSessions(),
  ]);
  const { id: selectedId, session: sessionFilter } = await searchParams;

  // Filter entries by session if filter is active
  const entries = sessionFilter
    ? sessionFilter === "legacy"
      ? allEntries.filter((e) => !e.sessionId)
      : allEntries.filter((e) => e.sessionId === sessionFilter)
    : allEntries;

  const selected = selectedId ? allEntries.find((m) => m.id === selectedId) : null;
  const unreadCount = entries.filter((m) => m.status === "unread").length;

  // Per-session counts for the filter dropdown
  const countsBySession = new Map<string, number>();
  let legacyCount = 0;
  for (const e of allEntries) {
    if (e.sessionId) {
      countsBySession.set(e.sessionId, (countsBySession.get(e.sessionId) ?? 0) + 1);
    } else {
      legacyCount++;
    }
  }

  return (
    <AdminShell section="community">
      <div>

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="arabic-text block text-emerald-deep">ملاحظاتكم</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Feedback Inbox
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {entries.length} response{entries.length !== 1 ? "s" : ""}
                {sessionFilter && (
                  <span className="ml-2 text-ink/50">
                    (of {allEntries.length} total)
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber text-white text-xs font-medium">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>

            {/* Session filter */}
            {(sessions.length > 0 || legacyCount > 0) && (
              <SessionFilter
                sessions={sessions.map((s) => ({
                  id: s.id,
                  title: s.title,
                  date: s.date,
                  count: countsBySession.get(s.id) ?? 0,
                }))}
                legacyCount={legacyCount}
                totalCount={allEntries.length}
                selected={sessionFilter}
              />
            )}
          </div>

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6">
            {/* List */}
            <div className="ornate-card p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {entries.length === 0 ? (
                <div className="p-10 text-center">
                  <MessageSquareHeart className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                  <p className="text-sm text-ink/60">
                    {sessionFilter
                      ? "No feedback for this session yet."
                      : "No feedback yet."}
                  </p>
                  {!sessionFilter && (
                    <p className="text-xs text-ink/40 mt-1">
                      Share{" "}
                      <code className="font-mono bg-border px-1 rounded">
                        /feedback
                      </code>{" "}
                      with cohort members.
                    </p>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {entries.map((entry) => {
                    const status = STATUS_CONFIG[entry.status];
                    const isSelected = entry.id === selectedId;
                    const displayName = entry.name?.trim() || "Anonymous";
                    const isAnonymous = !entry.name?.trim();
                    const preview =
                      entry.gatheringReflection ||
                      entry.oneChange ||
                      entry.advisorReflection ||
                      entry.deepestLine ||
                      entry.questions ||
                      entry.additionalNotes ||
                      "(rating only)";
                    return (
                      <li key={entry.id}>
                        <Link
                          href={`/admin/feedback?id=${entry.id}${
                            sessionFilter ? `&session=${sessionFilter}` : ""
                          }`}
                          className={`block p-4 rounded-xl transition ${
                            isSelected ? "bg-emerald-deep/5" : "hover:bg-surface-2/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span
                              className={`font-medium text-sm truncate flex items-center gap-1.5 ${
                                entry.status === "unread" ? "text-ink" : "text-ink/70"
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
                              Pre-session-selector entry
                            </p>
                          )}
                          <p className="text-xs text-ink/60 truncate">{preview}</p>
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
                <FeedbackDetail entry={selected} />
              ) : (
                <div className="h-full flex items-center justify-center py-20 text-center">
                  <div>
                    <MessageSquareHeart className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                    <p className="text-sm text-ink/60">
                      Select a response to view it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </AdminShell>
  );
}

function FeedbackDetail({ entry }: { entry: FeedbackEntry }) {
  const status = STATUS_CONFIG[entry.status];
  const isAnonymous = !entry.name?.trim();
  const displayName = entry.name?.trim() || "Anonymous respondent";

  return (
    <article className="space-y-6">
      {/* Header */}
      <header className="pb-5 border-b border-border">
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
          <div className="flex items-center gap-2">
            {entry.status === "unread" && <MarkFeedbackReadButton feedbackId={entry.id} />}
            <DeleteFeedbackButton feedbackId={entry.id} />
          </div>
        </div>

        {/* Session badge */}
        {entry.sessionTitle && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-emerald-deep/10 rounded-xl border border-emerald-deep/25">
            <CalendarDays className="h-4 w-4 text-emerald-deep shrink-0" />
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
        {!entry.sessionTitle && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs italic text-ink/45">
            <CalendarDays className="h-3.5 w-3.5" />
            Submitted before the session-selector was added.
          </div>
        )}

        {/* Contact info if provided */}
        {entry.whatsapp && (
          <div className="mt-4">
            <a
              href={`https://wa.me/${entry.whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm p-3 bg-emerald-deep/5 rounded-xl border border-emerald-deep/15 hover:bg-emerald-deep/10 transition"
            >
              <Phone className="h-4 w-4 text-emerald-deep shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ink/40">WhatsApp</p>
                <p className="text-sm font-medium text-emerald-deep truncate">
                  {entry.whatsapp}
                </p>
              </div>
            </a>
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-3 text-xs text-ink/40">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(entry.submittedAt)}
          {" · "}
          <code className="font-mono text-[10px] bg-border px-1.5 py-0.5 rounded">
            {entry.id}
          </code>
        </div>
      </header>

      {/* ── The Session ─────────────────────────────────── */}
      {(entry.gatheringRating || entry.gatheringReflection || entry.deepestLine) && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-emerald-deep font-semibold mb-3 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" /> The Session
          </h3>
          {entry.gatheringRating && (
            <div className="mb-3">
              <span className="text-[10px] uppercase tracking-wider text-ink/40 block mb-1">
                Rating
              </span>
              <RatingBadge value={entry.gatheringRating} />
            </div>
          )}
          {entry.gatheringReflection && (
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-wider text-ink/40 block mb-1">
                What stayed with them
              </span>
              <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap bg-surface-2 rounded-xl p-4 border border-border">
                {entry.gatheringReflection}
              </p>
            </div>
          )}
          {entry.deepestLine && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink/40 mb-1 flex items-center gap-1.5">
                <Quote className="h-3 w-3" /> The line that struck them most
              </span>
              <blockquote className="text-sm text-emerald-deep leading-relaxed whitespace-pre-wrap bg-emerald-deep/5 rounded-xl p-4 border-l-4 border-emerald-deep italic font-serif">
                &ldquo;{entry.deepestLine}&rdquo;
              </blockquote>
            </div>
          )}
        </section>
      )}

      {/* ── The One Change ─────────────────────────────────── */}
      {entry.oneChange && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-emerald-deep font-semibold mb-3 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" /> The One Change
          </h3>
          <span className="text-[10px] uppercase tracking-wider text-ink/40 block mb-1">
            What they will do this week
          </span>
          <p className="text-sm text-emerald-deep leading-relaxed whitespace-pre-wrap bg-emerald-deep/8 rounded-xl p-4 border border-emerald-deep/30 font-medium">
            {entry.oneChange}
          </p>
        </section>
      )}

      {/* ── The Speaker's Delivery ────────────────────────────── */}
      {(entry.advisorRating || entry.advisorReflection) && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-emerald-deep font-semibold mb-3 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" /> The Speaker&apos;s Delivery
          </h3>
          {entry.advisorRating && (
            <div className="mb-3">
              <span className="text-[10px] uppercase tracking-wider text-ink/40 block mb-1">
                Rating
              </span>
              <RatingBadge value={entry.advisorRating} />
            </div>
          )}
          {entry.advisorReflection && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink/40 block mb-1">
                Reflection
              </span>
              <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap bg-surface-2 rounded-xl p-4 border border-border">
                {entry.advisorReflection}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── Questions ─────────────────────────────────── */}
      {(entry.questions || entry.preferredChannel) && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-emerald-deep font-semibold mb-3 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> Questions
          </h3>
          {entry.questions && (
            <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap bg-surface-2 rounded-xl p-4 border border-border mb-3">
              {entry.questions}
            </p>
          )}
          {entry.preferredChannel && (
            <div className="text-xs">
              <span className="uppercase tracking-wider text-ink/40">
                Preferred response channel:
              </span>{" "}
              <span className="font-medium text-emerald-deep">
                {RESPONSE_CHANNEL_LABELS[entry.preferredChannel]}
              </span>
              {entry.preferredChannel === "other" && entry.channelOther && (
                <span className="text-ink/70"> — {entry.channelOther}</span>
              )}
              {(entry.preferredChannel === "whatsapp" ||
                entry.preferredChannel === "in-person") &&
                !entry.whatsapp &&
                isAnonymous && (
                  <p className="mt-2 flex items-center gap-1.5 text-emerald-deep italic">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Wanted a response but did not leave contact details.
                  </p>
                )}
            </div>
          )}
        </section>
      )}

      {/* ── Additional ─────────────────────────────────── */}
      {entry.additionalNotes && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-emerald-deep font-semibold mb-3">
            Additional Notes
          </h3>
          <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap bg-surface-2 rounded-xl p-4 border border-border">
            {entry.additionalNotes}
          </p>
        </section>
      )}
    </article>
  );
}

function RatingBadge({ value }: { value: string }) {
  if (!value || !(value in RATING_LABELS)) return null;
  const label = RATING_LABELS[value as keyof typeof RATING_LABELS];
  const tone =
    value === "excellent"
      ? "bg-emerald-deep text-white"
      : value === "good"
      ? "bg-emerald-deep/15 text-emerald-deep"
      : value === "average"
      ? "bg-emerald-deep/15 text-emerald-deep"
      : "bg-danger-100 text-danger-700";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}
