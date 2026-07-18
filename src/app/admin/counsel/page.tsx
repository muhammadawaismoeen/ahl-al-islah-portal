import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquareHeart,
  Clock,
  UserRound,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, login } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";
import { listThreads, COHORT_LABELS } from "@/lib/counsel-store";
import type { CounselThread, CounselMessage } from "@/lib/counsel-types";
import { formatDate } from "@/lib/utils";
import {
  ReplyBox,
  MarkReadButton,
  CloseThreadButton,
  DeleteThreadButton,
} from "./CounselActions";

export const metadata: Metadata = {
  title: "Counsel — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  open: { label: "Open", className: "bg-emerald-deep/15 text-emerald-deep" },
  closed: { label: "Closed", className: "bg-ink/20 text-ink/70" },
};

function formatShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminCounselPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container-prose max-w-md mx-auto">
            <div className="ornate-card p-8">
              <div className="text-center mb-6">
                <span className="arabic-text text-gold-antique">لوحة الإدارة</span>
                <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">
                  Admin Access
                </h1>
              </div>
              <LoginForm action={login} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const threads = await listThreads();
  const { id: selectedId } = await searchParams;
  const selected = selectedId ? threads.find((t) => t.id === selectedId) : null;
  const unreadCount = threads.filter((t) => t.advisorHasUnread).length;

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-2 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Core Members
              </Link>
              <span className="arabic-text block text-gold-antique">نصيحة</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Confidential Counsel
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {threads.length} thread{threads.length !== 1 ? "s" : ""}
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-gold-antique text-white text-xs font-medium">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6">
            {/* Threads list */}
            <div className="ornate-card p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-10 text-center">
                  <MessageSquareHeart className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                  <p className="text-sm text-ink/60">No threads yet.</p>
                  <p className="text-xs text-ink/40 mt-1">
                    Share{" "}
                    <code className="font-mono bg-cream-muted px-1 rounded">
                      /counsel
                    </code>{" "}
                    with those you want to reach.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-cream-muted">
                  {threads.map((t) => {
                    const status = STATUS_CONFIG[t.status];
                    const isSelected = t.id === selectedId;
                    const lastMsg = t.messages[t.messages.length - 1];
                    const cohortLabel = t.cohort
                      ? COHORT_LABELS[t.cohort]
                      : "Unspecified";
                    return (
                      <li key={t.id}>
                        <Link
                          href={`/admin/counsel?id=${t.id}`}
                          className={`block p-4 rounded-xl transition ${
                            isSelected
                              ? "bg-emerald-deep/5"
                              : "hover:bg-cream-warm/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span
                              className={`font-medium text-sm flex items-center gap-1.5 ${
                                t.advisorHasUnread ? "text-ink" : "text-ink/70"
                              }`}
                            >
                              <UserRound className="h-3.5 w-3.5 text-ink/40 shrink-0" />
                              Anonymous seeker
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {t.advisorHasUnread && (
                                <span className="h-2 w-2 rounded-full bg-gold-antique" />
                              )}
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-emerald-deep/70 mb-1">
                            {cohortLabel} · {t.messages.length} msg
                            {t.messages.length === 1 ? "" : "s"}
                          </p>
                          {lastMsg && (
                            <p className="text-xs text-ink/60 truncate">
                              {lastMsg.from === "advisor" ? "You: " : ""}
                              {lastMsg.body}
                            </p>
                          )}
                          <p className="text-[11px] text-ink/40 mt-1">
                            Updated {formatDate(t.updatedAt)}
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
                <ThreadDetail thread={selected} />
              ) : (
                <div className="h-full flex items-center justify-center py-20 text-center">
                  <div>
                    <MessageSquareHeart className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                    <p className="text-sm text-ink/60">
                      Select a thread to view it.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ThreadDetail({ thread }: { thread: CounselThread }) {
  const status = STATUS_CONFIG[thread.status];
  const cohortLabel = thread.cohort
    ? COHORT_LABELS[thread.cohort]
    : "Cohort not specified";

  return (
    <article className="space-y-6">
      {/* Header */}
      <header className="pb-5 border-b border-cream-muted">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span
              className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${status.className}`}
            >
              {status.label}
            </span>
            <h2 className="heading-serif text-2xl font-semibold text-emerald-deep leading-tight flex items-center gap-2">
              <UserRound className="h-5 w-5 text-ink/40" />
              Anonymous seeker
            </h2>
            <p className="text-sm text-gold-antique font-medium mt-1">
              {cohortLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {thread.advisorHasUnread && (
              <MarkReadButton threadId={thread.id} />
            )}
            <CloseThreadButton
              threadId={thread.id}
              isClosed={thread.status === "closed"}
            />
            <DeleteThreadButton threadId={thread.id} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-xs text-ink/40 flex-wrap">
          <Clock className="h-3.5 w-3.5" />
          Started {formatDate(thread.createdAt)}
          {" · "}
          <code className="font-mono text-[10px] bg-cream-muted px-1.5 py-0.5 rounded">
            {thread.id}
          </code>
        </div>
      </header>

      {/* Messages */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto">
        {thread.messages.map((m) => (
          <AdminMessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Reply box */}
      <div className="pt-2 border-t border-cream-muted">
        <ReplyBox threadId={thread.id} disabled={thread.status === "closed"} />
      </div>
    </article>
  );
}

function AdminMessageBubble({ message }: { message: CounselMessage }) {
  const isSeeker = message.from === "seeker";
  return (
    <div
      className={`flex gap-3 ${isSeeker ? "flex-row" : "flex-row-reverse"}`}
    >
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
          isSeeker
            ? "bg-cream-muted text-ink/60"
            : "bg-emerald-deep text-white"
        }`}
      >
        {isSeeker ? (
          <UserRound className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isSeeker
            ? "bg-cream-warm border border-cream-muted"
            : "bg-emerald-deep/10 border border-emerald-deep/20"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold ${
              isSeeker ? "text-ink/50" : "text-emerald-deep"
            }`}
          >
            {isSeeker ? "Seeker" : "You"}
          </span>
          <span className="text-[10px] text-ink/40">
            {formatShort(message.submittedAt)}
          </span>
        </div>
        <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap">
          {message.body}
        </p>
      </div>
    </div>
  );
}
