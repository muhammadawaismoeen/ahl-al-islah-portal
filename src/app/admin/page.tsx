import type { Metadata } from "next";
import Link from "next/link";
import {
  LogOut,
  Mail,
  Phone,
  Download,
  Pencil,
  MessageCircle,
  MessageSquareHeart,
  CalendarDays,
  ClipboardList,
  Users,
  Crown,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, login, logout } from "./actions";
import { listSubmissions } from "@/lib/storage";
import { listMessages } from "@/lib/message-store";
import { listFeedback } from "@/lib/feedback-store";
import { listSubmissions as listActivitySubmissions } from "@/lib/activity-submissions-store";
import { getPositionBySlug } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import { LoginForm } from "./LoginForm";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin · Membership applicants",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const isHeadSlug = (slug: string) => slug === "male-head" || slug === "female-head";
const isCoreSlug = (slug: string) =>
  slug === "core-member-male" || slug === "core-member-female";
const isGeneralSlug = (slug: string) => slug.startsWith("general-member");

type PositionFilter = "all" | "core" | "general";
type WingFilter = "male" | "female";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; wing?: string; position?: string }>;
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
                <span className="arabic-text text-gold-antique">
                  لوحة الإدارة
                </span>
                <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">
                  Admin Access
                </h1>
                <p className="text-sm text-ink/60 mt-2">
                  Review submitted applications. Advisor only.
                </p>
              </div>
              <LoginForm action={login} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const [submissions, messages, feedback, activitySubmissions] = await Promise.all([
    listSubmissions(),
    listMessages(),
    listFeedback(),
    listActivitySubmissions(),
  ]);
  const unreadMessages = messages.filter((m) => m.status === "unread").length;
  const unreadFeedback = feedback.filter((f) => f.status === "unread").length;
  const unreadActivities = activitySubmissions.filter((a) => a.status === "unread").length;

  const {
    id: selectedId,
    wing: wingParam,
    position: positionParam,
  } = await searchParams;

  const wing: WingFilter = wingParam === "female" ? "female" : "male";
  const positionFilter: PositionFilter =
    positionParam === "core"
      ? "core"
      : positionParam === "general"
      ? "general"
      : "all";

  // Membership applicants page covers Core Members + General Members only.
  // Head applications live on the separate admin-only /admin/heads page.
  const membershipSubmissions = submissions.filter(
    (s) => !isHeadSlug(s.positionSlug)
  );

  const wingScoped = membershipSubmissions.filter((s) => s.wing === wing);

  const filtered = wingScoped.filter((s) => {
    if (positionFilter === "core") return isCoreSlug(s.positionSlug);
    if (positionFilter === "general") return isGeneralSlug(s.positionSlug);
    return true;
  });

  const selected = selectedId
    ? membershipSubmissions.find((s) => s.id === selectedId)
    : null;

  // Counts
  const countBrothers = membershipSubmissions.filter((s) => s.wing === "male").length;
  const countSisters = membershipSubmissions.filter((s) => s.wing === "female").length;
  const countAllInWing = wingScoped.length;
  const countCoreInWing = wingScoped.filter((s) => isCoreSlug(s.positionSlug)).length;
  const countGeneralInWing = wingScoped.filter((s) => isGeneralSlug(s.positionSlug)).length;

  function filterUrl(params: { wing?: WingFilter; position?: PositionFilter }) {
    const nextWing = params.wing ?? wing;
    const nextPosition = params.position ?? positionFilter;
    const q = new URLSearchParams();
    q.set("wing", nextWing);
    if (nextPosition !== "all") q.set("position", nextPosition);
    return `/admin?${q.toString()}`;
  }

  const wingAccent =
    wing === "male"
      ? "bg-emerald-deep text-white"
      : "bg-gold-antique text-white";
  const wingHover =
    wing === "male"
      ? "hover:bg-emerald-deep/10 hover:text-emerald-deep"
      : "hover:bg-gold-antique/10 hover:text-gold-antique";

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="arabic-text text-gold-antique">لوحة الإدارة</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Membership applicants
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {filtered.length} of {countAllInWing} submission
                {countAllInWing === 1 ? "" : "s"} in{" "}
                {wing === "male" ? "Brothers" : "Sisters"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="btn-primary !py-2 !px-4 text-xs cursor-default"
                aria-current="page"
              >
                <Users className="h-3.5 w-3.5" />
                Membership applicants
              </span>
              <Link
                href="/admin/heads"
                className="btn-ghost !py-2 !px-4 text-xs"
              >
                <Crown className="h-3.5 w-3.5" />
                Heads
              </Link>
              <Link
                href="/admin/messages"
                className="btn-ghost !py-2 !px-4 text-xs relative"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Inbox
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold-antique text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                href="/admin/feedback"
                className="btn-ghost !py-2 !px-4 text-xs relative"
              >
                <MessageSquareHeart className="h-3.5 w-3.5" />
                Feedback
                {unreadFeedback > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold-antique text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadFeedback}
                  </span>
                )}
              </Link>
              <Link
                href="/admin/activity-submissions"
                className="btn-ghost !py-2 !px-4 text-xs relative"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Audits
                {unreadActivities > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold-antique text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadActivities}
                  </span>
                )}
              </Link>
              <Link
                href="/admin/sessions"
                className="btn-ghost !py-2 !px-4 text-xs"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Sessions
              </Link>
              <Link
                href="/admin/content"
                className="btn-ghost !py-2 !px-4 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                Content Editor
              </Link>
              <form action={logout}>
                <button type="submit" className="btn-secondary !py-2 !px-4 text-xs">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </form>
            </div>
          </div>

          {/* Cohort filter (top row) */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Link
              href={filterUrl({ wing: "male" })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                wing === "male"
                  ? "bg-emerald-deep text-white"
                  : "bg-cream-muted text-ink/60 hover:bg-emerald-deep/10 hover:text-emerald-deep"
              }`}
            >
              Brothers ({countBrothers})
            </Link>
            <Link
              href={filterUrl({ wing: "female" })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                wing === "female"
                  ? "bg-gold-antique text-white"
                  : "bg-cream-muted text-ink/60 hover:bg-gold-antique/10 hover:text-gold-antique"
              }`}
            >
              Sisters ({countSisters})
            </Link>
          </div>

          {/* Position filter (sub-row, wing-scoped) */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href={filterUrl({ position: "all" })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                positionFilter === "all"
                  ? wingAccent
                  : `bg-cream-muted text-ink/60 ${wingHover}`
              }`}
            >
              All ({countAllInWing})
            </Link>
            <Link
              href={filterUrl({ position: "core" })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                positionFilter === "core"
                  ? wingAccent
                  : `bg-cream-muted text-ink/60 ${wingHover}`
              }`}
            >
              Core Members ({countCoreInWing})
            </Link>
            <Link
              href={filterUrl({ position: "general" })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                positionFilter === "general"
                  ? wingAccent
                  : `bg-cream-muted text-ink/60 ${wingHover}`
              }`}
            >
              General Members ({countGeneralInWing})
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            {/* List */}
            <div className="ornate-card p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-8 text-sm text-ink/60 text-center">
                  {membershipSubmissions.length === 0
                    ? "No applications yet."
                    : "No applications match this filter."}
                </p>
              ) : (
                <ul className="divide-y divide-cream-muted">
                  {filtered.map((s) => {
                    const position = getPositionBySlug(s.positionSlug);
                    const name =
                      (s.data.fullName as string) ??
                      (s.data.name as string) ??
                      "Unnamed";
                    const isSelected = s.id === selectedId;
                    const selectionParams = new URLSearchParams();
                    selectionParams.set("id", s.id);
                    selectionParams.set("wing", wing);
                    if (positionFilter !== "all")
                      selectionParams.set("position", positionFilter);
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/admin?${selectionParams.toString()}`}
                          className={`block p-4 rounded-xl transition ${
                            isSelected
                              ? "bg-emerald-deep/5"
                              : "hover:bg-cream-warm/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="font-medium text-ink truncate">
                              {name}
                            </div>
                            <WingDot wing={s.wing} />
                          </div>
                          <div className="text-xs text-ink/60 truncate">
                            {position?.title ?? s.positionTitle}
                          </div>
                          <div className="text-[11px] text-ink/40 mt-1">
                            {formatDate(s.submittedAt)}
                          </div>
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
                <SubmissionDetail
                  submission={selected}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center py-20">
                  <div>
                    <p className="text-sm text-ink/60">
                      Select a submission to view its details.
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

function WingDot({ wing }: { wing: string }) {
  const color =
    wing === "male"
      ? "bg-emerald-deep"
      : wing === "female"
      ? "bg-gold-antique"
      : "bg-ink/40";
  return (
    <span
      className={`h-2 w-2 rounded-full ${color} shrink-0 mt-1.5`}
      aria-label={`${wing} wing`}
    />
  );
}

type Submission = Awaited<ReturnType<typeof listSubmissions>>[number];

function SubmissionDetail({ submission }: { submission: Submission }) {
  const position = getPositionBySlug(submission.positionSlug);
  const qs = position ? getQuestionSet(position.questionSet) : null;
  const data = submission.data as Record<string, unknown>;

  const jsonString = JSON.stringify(submission, null, 2);
  const downloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(
    jsonString
  )}`;
  const downloadName = `${submission.id}.json`;

  const email = (data.email as string) ?? "";
  const phone = (data.phone as string) ?? "";

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
              <code className="font-mono bg-cream-muted px-1.5 py-0.5 rounded">
                {submission.id}
              </code>
            </p>
          </div>
          <a
            href={downloadHref}
            download={downloadName}
            className="btn-ghost !py-1.5 !px-3 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
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
