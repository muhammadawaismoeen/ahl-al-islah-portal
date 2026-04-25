import type { Metadata } from "next";
import { Lock, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { AskAdvisorForm } from "./AskAdvisorForm";

export const metadata: Metadata = {
  title: "Ask Advisor — Ahl Al-Islah",
  description: "Private message channel for department leadership.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AskAdvisorPage() {
  const content = await getContent();

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <MessageCircle className="h-7 w-7 text-emerald-deep" />
            </div>
            <span className="arabic-text block text-gold-antique text-lg mb-1">
              اسأل المستشار
            </span>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Ask the Advisor
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              A private channel for department leadership. Your message goes directly and confidentially to the Advisor.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-4 text-xs text-ink/50 bg-cream-warm px-3 py-1.5 rounded-full border border-cream-muted">
              <Lock className="h-3 w-3" />
              Private &amp; confidential
            </div>
          </div>

          <AskAdvisorForm />

        </div>
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}
