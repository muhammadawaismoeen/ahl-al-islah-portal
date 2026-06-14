import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ListChecks, Clock, Video } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { listSessions } from "@/lib/sessions-store";
import { getContent } from "@/lib/content-store";
import { formatDate, formatSessionTime } from "@/lib/utils";
import { ClassActivityButton } from "./[slug]/ClassActivityButton";

export const metadata: Metadata = {
  title: "Sessions — Ahl Al-Islah",
  description:
    "Gatherings, workshops, and reflections from Ahl Al-Islah — the activities we ran, in the words we ran them.",
};

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const [sessions, content] = await Promise.all([listSessions(), getContent()]);

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-28 pb-20">
        <div className="container-prose max-w-4xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12">
            <span className="arabic-text text-gold-antique">الجلسات</span>
            <h1 className="heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep mt-1">
              Sessions
            </h1>
            <p className="text-base text-ink/65 max-w-2xl mx-auto mt-4 leading-relaxed">
              A record of our gatherings — the activities, the reflections, the
              moments that defined each evening. Read them in the order they
              were lived.
            </p>
          </header>

          {sessions.length === 0 ? (
            <div className="ornate-card p-12 text-center">
              <CalendarDays className="h-12 w-12 text-ink/20 mx-auto mb-4" />
              <p className="text-ink/60">
                No sessions have been published yet. Come back soon.
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {sessions.map((s) => {
                const timeRange = formatSessionTime(s.startTime, s.endTime);
                return (
                  <li key={s.id}>
                    <div className="ornate-card p-6 sm:p-8 group">
                      <Link href={`/sessions/${s.slug}`} className="block">
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                          <span className="text-xs uppercase tracking-widest text-gold-antique inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(s.date)}
                          </span>
                          {timeRange && (
                            <span className="text-xs text-emerald-deep/80 inline-flex items-center gap-1.5 font-medium">
                              <Clock className="h-3.5 w-3.5" />
                              {timeRange}
                            </span>
                          )}
                          <span className="text-xs text-ink/45 inline-flex items-center gap-1.5">
                            <ListChecks className="h-3.5 w-3.5" />
                            {s.activities.length} activit
                            {s.activities.length === 1 ? "y" : "ies"}
                          </span>
                        </div>
                        {s.arabicTitle && (
                          <p className="arabic-text text-lg text-gold-antique mb-1">
                            {s.arabicTitle}
                          </p>
                        )}
                        <h2 className="heading-serif text-2xl sm:text-3xl font-semibold text-emerald-deep leading-tight group-hover:text-emerald-rich transition">
                          {s.title}
                        </h2>
                        {s.description && (
                          <p className="mt-3 text-ink/70 leading-relaxed">
                            {s.description}
                          </p>
                        )}
                      </Link>
                      {(s.meetingLink || s.startTime) && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {s.meetingLink && (
                            <a
                              href={s.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary inline-flex !py-2 !px-4 text-sm"
                            >
                              <Video className="h-4 w-4" />
                              Join the session
                            </a>
                          )}
                          {s.startTime && (
                            <ClassActivityButton
                              sessionId={s.id}
                              date={s.date}
                              startTime={s.startTime}
                              className="!py-2 !px-4 text-sm"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
