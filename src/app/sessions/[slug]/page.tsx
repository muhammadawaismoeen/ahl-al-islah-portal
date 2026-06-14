import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Timer } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getSessionBySlug, sortActivities } from "@/lib/sessions-store";
import { getContent } from "@/lib/content-store";
import { ActivityBody } from "@/components/ActivityBody";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  if (!session) return { title: "Session not found" };
  return {
    title: `${session.title} — Ahl Al-Islah`,
    description: session.description ?? `Session held on ${session.date}`,
  };
}

export default async function SessionDetailPage({ params }: Props) {
  const { slug } = await params;
  const [session, content] = await Promise.all([
    getSessionBySlug(slug),
    getContent(),
  ]);
  if (!session) notFound();

  const activities = sortActivities(session.activities);

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-28 pb-20">
        <div className="container-prose max-w-3xl mx-auto">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-emerald-deep mb-6 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            All sessions
          </Link>

          {/* Session header */}
          <header className="mb-12">
            <span className="text-xs uppercase tracking-widest text-gold-antique inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(session.date)}
            </span>
            {session.arabicTitle && (
              <p className="arabic-text text-2xl text-gold-antique mt-3 mb-1">
                {session.arabicTitle}
              </p>
            )}
            <h1 className="heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep leading-tight">
              {session.title}
            </h1>
            {session.description && (
              <p className="mt-4 text-lg text-ink/70 leading-relaxed">
                {session.description}
              </p>
            )}
          </header>

          {/* Activities */}
          {activities.length === 0 ? (
            <div className="ornate-card p-12 text-center">
              <p className="text-ink/55">
                No activities have been published for this session yet.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {activities.map((a, idx) => (
                <article
                  key={a.id}
                  className="ornate-card p-6 sm:p-10 scroll-mt-24"
                  id={`activity-${idx + 1}`}
                >
                  <div className="pb-5 mb-6 border-b border-cream-muted">
                    <span className="text-[10px] uppercase tracking-widest text-gold-antique font-medium">
                      Activity {idx + 1}
                    </span>
                    <h2 className="heading-serif text-2xl sm:text-3xl font-semibold text-emerald-deep mt-1 leading-tight">
                      {a.title}
                    </h2>
                    {(a.timeMarker || a.durationMin !== undefined) && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink/55">
                        {a.timeMarker && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {a.timeMarker}
                          </span>
                        )}
                        {a.durationMin !== undefined && (
                          <span className="inline-flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5" />
                            {a.durationMin} minutes
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ActivityBody body={a.body} />
                </article>
              ))}
            </div>
          )}

          {/* Bottom nav */}
          <div className="mt-14 text-center">
            <Link
              href="/sessions"
              className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-emerald-deep transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all sessions
            </Link>
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
