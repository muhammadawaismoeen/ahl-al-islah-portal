import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { signIn } from "@/lib/auth";
import { SignInButton } from "./SignInButton";

export const metadata: Metadata = {
  title: "Sign in — Qur'an & Seerah Drive",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DESTINATION_LABEL: Record<string, string> = {
  "/drive/donate": "the Donate page",
  "/drive/apply": "your application",
  "/drive/ambassador": "Ambassador registration",
  "/drive/ambassador/certificate": "your certificate",
  "/drive/ambassador/instructions": "the Ambassador instructions",
};

export default async function DriveSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; switch?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/drive";
  const switchAccount = params.switch === "1";
  const destinationLabel = DESTINATION_LABEL[callbackUrl] ?? "the Drive";
  const content = await getContent();

  async function handleSignIn() {
    "use server";
    await signIn(
      "google",
      { redirectTo: callbackUrl },
      switchAccount ? { prompt: "select_account" } : undefined
    );
  }

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-md mx-auto">
          <Link
            href="/drive"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-6 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the Drive
          </Link>

          <div className="ornate-card p-8 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              {switchAccount ? (
                <RefreshCw className="h-7 w-7 text-emerald-deep" />
              ) : (
                <ShieldCheck className="h-7 w-7 text-emerald-deep" />
              )}
            </div>
            <h1 className="heading-serif text-2xl font-semibold text-emerald-deep">
              {switchAccount ? "Switch Google account" : "Sign in to continue"}
            </h1>
            <p className="mt-3 text-sm text-ink/65 leading-relaxed">
              {switchAccount
                ? "Google will let you pick a different account next."
                : "Google will ask you to pick an account next."}{" "}
              We only use it to confirm your name and email — the Drive never
              sees your Gmail, contacts, or files, and nothing is ever posted
              on your behalf.
            </p>

            <div className="mt-6">
              <SignInButton
                action={handleSignIn}
                label={switchAccount ? "Choose a Google account" : "Continue with Google"}
              />
            </div>

            <p className="mt-4 text-[11px] text-ink/40">
              You&apos;ll land straight back on {destinationLabel} once you&apos;re signed in.
            </p>
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
