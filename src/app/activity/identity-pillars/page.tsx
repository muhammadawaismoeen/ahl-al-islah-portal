import type { Metadata } from "next";
import { ClipboardList, Shield } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { getSession } from "@/lib/sessions-store";
import { formatDate } from "@/lib/utils";
import { IdentityPillarsForm } from "./IdentityPillarsForm";

export const metadata: Metadata = {
  title: "Identity Pillars Audit — Ahl Al-Islah",
  description:
    "Audit the three pillars your life is actually built on. Mark which are Allah-grounded and which are approval-grounded. Private, printable.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ session?: string }>;
}

export default async function IdentityPillarsActivityPage({
  searchParams,
}: Props) {
  const { session: sessionParam } = await searchParams;
  const [content, session] = await Promise.all([
    getContent(),
    sessionParam ? getSession(sessionParam) : Promise.resolve(null),
  ]);

  const sessionTitle = session?.title;
  const sessionDate = session ? formatDate(session.date) : undefined;

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 no-print">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <ClipboardList className="h-7 w-7 text-emerald-deep" />
            </div>
            <span className="arabic-text block text-gold-antique text-lg mb-1">
              ركائز الهوية
            </span>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Identity Pillars Audit
            </h1>
            {sessionTitle && (
              <p className="mt-2 text-sm text-emerald-deep/75">
                {sessionTitle}
                {sessionDate ? ` · ${sessionDate}` : ""}
              </p>
            )}
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              Ibrahim عليه السلام held one pillar — and every test was the same
              question: will you hold it even now? Audit yours.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-4 text-xs text-ink/50 bg-cream-warm px-3 py-1.5 rounded-full border border-cream-muted">
              <Shield className="h-3 w-3" />
              Private · printable
            </div>
          </div>

          {/* Pre-form prompt — speaker's voice from the seed activity */}
          <div className="ornate-card p-6 sm:p-7 mb-6 bg-cream-warm/30 no-print">
            <p className="text-sm text-ink/80 leading-relaxed">
              We walked through three stages of Ibrahim&apos;s journey —{" "}
              <em>Fitra</em> (the compass), <em>Yaqeen</em> (the certainty that
              acts alone), <em>Tawakkul</em> (the act that releases the
              outcome). Now, do something for yourself.
            </p>
            <p className="text-sm text-ink/80 leading-relaxed mt-3">
              Identify three pillars in your life right now — not your values
              in theory, but the things you{" "}
              <strong>actually build your decisions on</strong>. The
              non-negotiables. The lines you have drawn. The things that, if
              removed, would mean you are no longer you.
            </p>
            <p className="text-sm text-ink/80 leading-relaxed mt-3">
              Then mark each one{" "}
              <strong className="text-emerald-deep">A</strong> or{" "}
              <strong className="text-gold-antique">B</strong>:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
              <li>
                <strong className="text-emerald-deep">A</strong> — Allah-grounded.
                Holds even if everyone around you disagrees.
              </li>
              <li>
                <strong className="text-gold-antique">B</strong> — Approval-grounded.
                Depends on people around you validating it.
              </li>
            </ul>
          </div>

          <IdentityPillarsForm
            sessionId={session?.id}
            sessionTitle={sessionTitle}
            sessionDate={sessionDate}
          />
        </div>
      </main>
      <div className="no-print">
        <Footer
          content={content.footer}
          navContent={content.nav}
          customLogo={content.customLogo}
        />
      </div>
    </>
  );
}
