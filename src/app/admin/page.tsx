import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, Mail, Phone, Download } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, login, logout } from "./actions";
import { listSubmissions } from "@/lib/storage";
import { getPositionBySlug } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import { LoginForm } from "./LoginForm";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin · Applications",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage({
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

  const submissions = await listSubmissions();
  const { id: selectedId } = await searchParams;
  const selected = selectedId
    ? submissions.find((s) => s.id === selectedId)
    : null;

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="arabic-text text-gold-antique">لوحة الإدارة</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Applications
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {submissions.length} total submission
                {submissions.length === 1 ? "" : "s"}
              </p>
            </div>
            <form action={logout}>
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
                <p className="p-8 text-sm text-ink/60 text-center">
                  No applications yet.
                </p>
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
                          href={`/admin?id=${s.id}`}
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
