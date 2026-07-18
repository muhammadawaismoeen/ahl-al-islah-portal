import type { Metadata } from "next";
import { MessageCircle, Lock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { getCurrentThreadId } from "./actions";
import { getThread, markSeekerRead } from "@/lib/counsel-store";
import { StartCounselForm } from "./StartCounselForm";
import { ThreadView } from "./ThreadView";
import { ClaimCodeGate } from "./ClaimCodeGate";

export const metadata: Metadata = {
  title: "Confidential Counsel — Ahl Al-Islah",
  description:
    "A private, anonymous channel to reach the Advisor for counselling and life-coach conversations.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CounselPage() {
  const content = await getContent();
  const threadId = await getCurrentThreadId();
  const thread = threadId ? await getThread(threadId) : null;

  if (thread && thread.seekerHasUnread) {
    await markSeekerRead(thread.id);
  }

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <MessageCircle className="h-7 w-7 text-emerald-deep" />
            </div>
            <span className="arabic-text block text-gold-antique text-lg mb-1">
              نصيحة
            </span>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Confidential Counsel
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              A private space to bring what&apos;s weighing on you — a question, a
              struggle, a decision. Every thread goes only to the Advisor.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-4 text-xs text-ink/50 bg-cream-warm px-3 py-1.5 rounded-full border border-cream-muted">
              <Lock className="h-3 w-3" />
              Anonymous · No name required · Only the Advisor reads
            </div>
          </div>

          {thread ? (
            <ThreadView thread={thread} />
          ) : (
            <>
              <StartCounselForm />
              <div className="mt-8">
                <ClaimCodeGate />
              </div>
            </>
          )}

          {/* Honest disclosure */}
          <details className="mt-10 text-xs text-ink/55 bg-cream-warm/40 rounded-xl border border-cream-muted p-4">
            <summary className="cursor-pointer font-medium text-ink/70">
              What &ldquo;private&rdquo; means here
            </summary>
            <div className="mt-3 space-y-2 leading-relaxed">
              <p>
                <strong>Who reads it:</strong> only the Advisor. No other role
                on the portal has access to counsel threads.
              </p>
              <p>
                <strong>Where it&apos;s stored:</strong> on the portal&apos;s servers
                alongside the other data we hold. For true anonymity, avoid
                sharing details that identify you unless you want the Advisor
                to know.
              </p>
              <p>
                <strong>How you return:</strong> a cookie recognises you on
                this device. To reach the thread from a different device, use
                the claim code shown once at first submission — save it.
              </p>
              <p>
                <strong>How to end it:</strong> you can delete the thread
                yourself at any time. Once deleted, the Advisor can no longer
                access it either.
              </p>
            </div>
          </details>
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
