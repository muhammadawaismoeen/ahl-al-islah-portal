import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, Download, Crown } from "lucide-react";
import { isAuthenticated } from "@/app/admin/actions";
import { listSubmissions } from "@/lib/storage";
import { getAllPositions } from "@/lib/positions";
import type { Position } from "@/lib/positions";
import { getQuestionSet } from "@/lib/questions";
import { formatDate } from "@/lib/utils";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

export const metadata: Metadata = {
  title: "Admin · Heads",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const isHeadSlug = (slug: string) => slug === "male-head" || slug === "female-head";

export default async function AdminHeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; wing?: string }>;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return <AdminLoginScreen subtitle="Review submitted applications. Advisor only." />;
  }

  const [allSubmissions, positions] = await Promise.all([
    listSubmissions(),
    getAllPositions(),
  ]);
  const positionsMap = new Map(positions.map((p) => [p.slug, p]));

  const headSubmissions = allSubmissions.filter((s) => isHeadSlug(s.positionSlug));

  const { id: selectedId, wing: wingParam } = await searchParams;
  const wingFilter =
    wingParam === "male" || wingParam === "female" ? wingParam : undefined;

  const filtered = wingFilter
    ? headSubmissions.filter((s) => s.wing === wingFilter)
    : headSubmissions;

  const selected = selectedId
    ? headSubmissions.find((s) => s.id === selectedId)
    : null;

  const countAll = headSubmissions.length;
  const countBrothers = headSubmissions.filter((s) => s.wing === "male").length;
  const countSisters = headSubmissions.filter((s) => s.wing === "female").length;

  function filterUrl(params: { wing?: "male" | "female" | null }) {
    const q = new URLSearchParams();
    const nextWing = params.wing === undefined ? wingFilter : params.wing;
    if (nextWing) q.set("wing", nextWing);
    const s = q.toString();
    return `/admin/heads${s ? `?${s}` : ""}`;
  }

  return (
    <AdminShell>
      <div>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <span className="arabic-text text-emerald-deep">رؤساء</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Heads
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {filtered.length} of {countAll} head application
                {countAll === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Cohort filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Link
              href={filterUrl({ wing: null })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                !wingFilter
                  ? "bg-emerald-deep text-white"
                  : "bg-border text-ink/60 hover:bg-emerald-deep/10 hover:text-emerald-deep"
              }`}
            >
              All ({countAll})
            </Link>
            <Link
              href={filterUrl({ wing: "male" })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                wingFilter === "male"
                  ? "bg-emerald-deep text-white"
                  : "bg-border text-ink/60 hover:bg-emerald-deep/10 hover:text-emerald-deep"
              }`}
            >
              Brothers ({countBrothers})
            </Link>
            <Link
              href={filterUrl({ wing: "female" })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                wingFilter === "female"
                  ? "bg-sapphire text-white"
                  : "bg-border text-ink/60 hover:bg-sapphire/10 hover:text-sapphire"
              }`}
            >
              Sisters ({countSisters})
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            {/* List */}
            <div className="ornate-card p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-8 text-sm text-ink/60 text-center">
                  {headSubmissions.length === 0
                    ? "No head applications yet."
                    : "No applications match this filter."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((s) => {
                    const position = positionsMap.get(s.positionSlug);
                    const name =
                      (s.data.fullName as string) ??
                      (s.data.name as string) ??
                      "Unnamed";
                    const isSelected = s.id === selectedId;
                    const selectionParams = new URLSearchParams();
                    selectionParams.set("id", s.id);
                    if (wingFilter) selectionParams.set("wing", wingFilter);
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/admin/heads?${selectionParams.toString()}`}
                          className={`block p-4 rounded-xl transition ${
                            isSelected
                              ? "bg-emerald-deep/5"
                              : "hover:bg-surface-2/40"
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
                  position={positionsMap.get(selected.positionSlug)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center py-20">
                  <div>
                    <Crown className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                    <p className="text-sm text-ink/60">
                      Select an application to view its details.
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

function WingDot({ wing }: { wing: string }) {
  const color =
    wing === "male"
      ? "bg-emerald-deep"
      : wing === "female"
      ? "bg-sapphire"
      : "bg-ink/40";
  return (
    <span
      className={`h-2 w-2 rounded-full ${color} shrink-0 mt-1.5`}
      aria-label={`${wing} wing`}
    />
  );
}

type Submission = Awaited<ReturnType<typeof listSubmissions>>[number];

function SubmissionDetail({
  submission,
  position,
}: {
  submission: Submission;
  position: Position | undefined;
}) {
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
      <header className="pb-6 border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-deep">
              {position?.title ?? submission.positionTitle}
            </div>
            <h2 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">
              {(data.fullName as string) ?? "Unnamed applicant"}
            </h2>
            <p className="text-xs text-ink/50 mt-1">
              Submitted {formatDate(submission.submittedAt)} · Ref{" "}
              <code className="font-mono bg-border px-1.5 py-0.5 rounded">
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
              <h3 className="heading-serif text-lg font-semibold text-emerald-deep mb-3 pb-2 border-b border-border">
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
          <pre className="p-4 rounded-lg bg-border text-xs overflow-x-auto">
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
