import type { Metadata } from "next";
import { MessageSquareHeart, Shield } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { listSessions } from "@/lib/sessions-store";
import { FeedbackForm } from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Anonymous Feedback — Ahl Al-Islah",
  description:
    "Share your honest reflections on any Ahl Al-Islah session — the experience, the Speaker, your questions. Stay anonymous, or leave a name.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const [content, sessions] = await Promise.all([
    getContent(),
    listSessions(),
  ]);

  const sessionOptions = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date,
  }));

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <MessageSquareHeart className="h-7 w-7 text-emerald-deep" />
            </div>
            <span className="arabic-text block text-gold-antique text-lg mb-1">
              ملاحظاتكم
            </span>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Session Feedback
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              Pick the session you&apos;re reflecting on and share what stayed
              with you. Your honest words shape every session that follows.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-4 text-xs text-ink/50 bg-cream-warm px-3 py-1.5 rounded-full border border-cream-muted">
              <Shield className="h-3 w-3" />
              Name &amp; WhatsApp are optional
            </div>
          </div>

          <FeedbackForm sessions={sessionOptions} />

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
