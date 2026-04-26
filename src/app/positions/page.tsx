import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Clock, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getAllPositions, type Position } from "@/lib/positions";
import { getContent } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "Open Positions",
  description:
    "Apply for leadership and service positions within Ahl Al-Islah. Currently open: Male Head and Female Head of Ahl Al-Islah.",
};

function WingBadge({ wing }: { wing: Position["wing"] }) {
  const map = {
    male: {
      label: "Brothers' Cohort",
      arabic: "جناح الإخوة",
      className: "bg-emerald-deep/10 text-emerald-deep border-emerald-deep/20",
    },
    female: {
      label: "Sisters' Cohort",
      arabic: "جناح الأخوات",
      className: "bg-gold-antique/10 text-gold-antique border-gold-antique/30",
    },
    both: {
      label: "Either Cohort",
      arabic: "كلا الجناحين",
      className: "bg-ink/5 text-ink border-ink/15",
    },
  } as const;
  const config = map[wing];
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      <span>{config.label}</span>
      <span className="arabic-text opacity-70">{config.arabic}</span>
    </span>
  );
}

function PositionCard({ position }: { position: Position }) {
  return (
    <div className="ornate-card p-7 flex flex-col h-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <WingBadge wing={position.wing} />
        {position.open ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-rich/10 text-emerald-rich text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-rich opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-rich" />
            </span>
            Open
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink/5 text-ink/50 text-xs font-medium">
            Closed
          </span>
        )}
      </div>

      {position.arabicTitle && (
        <p className="arabic-text text-lg text-gold-antique mb-1">
          {position.arabicTitle}
        </p>
      )}
      <h3 className="heading-serif text-2xl font-semibold text-emerald-deep mb-2">
        {position.title}
      </h3>
      <p className="text-sm text-ink/70 leading-relaxed mb-5 flex-1">
        {position.summary}
      </p>

      <div className="space-y-2 mb-6 text-xs text-ink/60">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-gold-antique shrink-0" />
          <span>Reports to: <span className="text-ink/80">{position.reportsTo}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-gold-antique shrink-0" />
          <span>Commitment: <span className="text-ink/80">{position.commitment}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-gold-antique shrink-0" />
          <span>Term: <span className="text-ink/80">{position.termLength}</span></span>
        </div>
      </div>

      {position.open ? (
        position.slug.startsWith("core-member") ? (
          <Link
            href="/join"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-gold-gradient text-ink font-semibold tracking-wide shadow-md hover:shadow-gold-warm/30 hover:scale-[1.02] transition-all"
          >
            Join as Core Member
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={`/apply/${position.slug}`}
            className="btn-primary w-full group"
          >
            Apply for this role
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )
      ) : (
        <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
          Applications closed
        </button>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function PositionsPage() {
  const positions = getAllPositions();
  const content = await getContent();
  const open = positions.filter((p) => p.open);
  const closed = positions.filter((p) => !p.open);

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="section-eyebrow">Join the work</span>
            <h1 className="mt-6 heading-serif text-4xl sm:text-6xl font-semibold text-emerald-deep text-balance">
              Open Positions
            </h1>
            <div className="gold-divider" />
            <p className="mt-4 text-lg text-ink/70 leading-relaxed">
              Leadership in Ahl Al-Islah is a trust (
              <span className="arabic-text text-gold-antique">أمانة</span>).
              Before applying, please read the Department Structure &amp;
              Strategic Roadmap document in full — and make istikharah.
            </p>
          </div>

          {open.length > 0 && (
            <section>
              <h2 className="heading-serif text-2xl font-semibold text-emerald-deep mb-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gold-antique/30" />
                <span>Currently Open</span>
                <span className="h-px flex-1 bg-gold-antique/30" />
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {open.map((position) => (
                  <PositionCard key={position.slug} position={position} />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section className="mt-20 opacity-60">
              <h2 className="heading-serif text-2xl font-semibold text-ink/70 mb-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink/20" />
                <span>Future Positions</span>
                <span className="h-px flex-1 bg-ink/20" />
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {closed.map((position) => (
                  <PositionCard key={position.slug} position={position} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-20 max-w-2xl mx-auto text-center text-sm text-ink/60 p-6 rounded-2xl bg-cream-warm border border-cream-muted">
            <p>
              <span className="font-serif italic text-emerald-deep">Tip: </span>
              Make istikharah before applying, and make du&rsquo;a that Allah
              places you where He is most pleased with you — whether that is
              in this role or elsewhere.
            </p>
          </div>
        </div>
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}
