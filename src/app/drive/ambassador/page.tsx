import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, Clock3, CheckCircle2, XCircle, GraduationCap, FileText, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { auth } from "@/lib/auth";
import { getActiveDrive, listAmbassadorsByEmail } from "@/lib/drive-store";
import { getDriveSettings } from "@/lib/drive-settings";
import { isCollegeEmail, COLLEGE_EMAIL_DOMAIN, DRIVE_CURRENCY } from "@/lib/drive-config";
import type { Ambassador } from "@/lib/drive-types";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Drive Ambassador — Ahl Al-Islah",
  description:
    "Register as a Drive Ambassador, set a donation target, and rally your community to give.",
};

export const dynamic = "force-dynamic";

export default async function AmbassadorPage() {
  const [content, session, drive, settings] = await Promise.all([
    getContent(),
    auth(),
    getActiveDrive(),
    getDriveSettings(),
  ]);
  const email = session?.user?.email ?? null;
  const eligible = email ? isCollegeEmail(email) : false;
  const registrations = email ? await listAmbassadorsByEmail(email) : [];
  const existing = registrations.find((a) => a.status !== "rejected") ?? registrations[0] ?? null;

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-xl mx-auto">
          <Link
            href="/drive"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-6 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the Drive
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <Award className="h-7 w-7 text-emerald-deep" />
            </div>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Drive Ambassador
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              Set a donation target, rally your community, and earn a
              certificate once you reach it.
            </p>
          </div>

          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/[0.08] p-4">
            <AlertTriangle className="h-5 w-5 text-amber shrink-0 mt-0.5" />
            <p className="text-sm text-ink/75 leading-relaxed">
              <strong className="text-ink">
                You must sign in with your official {COLLEGE_EMAIL_DOMAIN}
              </strong>{" "}
              student email to register as an Ambassador — registration is
              restricted to Akhtar Saeed Medical and Dental College accounts.
            </p>
          </div>

          {!email ? (
            <div className="ornate-card p-8 text-center">
              <p className="text-sm text-ink/60 mb-4">
                Sign in with your official {COLLEGE_EMAIL_DOMAIN} email to
                register as an Ambassador.
              </p>
              <Link
                href={`/drive/signin?callbackUrl=${encodeURIComponent("/drive/ambassador")}`}
                className="btn-primary inline-flex"
              >
                Sign in with Google
              </Link>
            </div>
          ) : !eligible ? (
            <div className="ornate-card p-8 text-center">
              <GraduationCap className="h-8 w-8 text-ink/25 mx-auto mb-3" />
              <p className="text-sm text-ink/70 font-medium mb-1">
                Use your official college email
              </p>
              <p className="text-sm text-ink/60 mb-4">
                Ambassador registration is only open to Akhtar Saeed Medical
                and Dental College student accounts ({COLLEGE_EMAIL_DOMAIN}
                ). You&apos;re signed in as <strong>{email}</strong>.
              </p>
              <Link
                href={`/drive/signin?switch=1&callbackUrl=${encodeURIComponent("/drive/ambassador")}`}
                className="btn-secondary inline-flex"
              >
                Switch Google account
              </Link>
            </div>
          ) : existing ? (
            <ExistingRegistration ambassador={existing} />
          ) : !drive ? (
            <div className="ornate-card p-8 text-center">
              <p className="text-sm text-ink/60">
                There&apos;s no open drive to register for right now — check back soon.
              </p>
            </div>
          ) : (
            <RegisterForm
              drive={drive}
              ihsanPercentage={settings.ihsanPercentage}
              defaultName={session?.user?.name ?? ""}
            />
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

function ExistingRegistration({ ambassador }: { ambassador: Ambassador }) {
  if (ambassador.status === "pending") {
    return (
      <div className="ornate-card p-8 text-center">
        <Clock3 className="h-8 w-8 text-amber mx-auto mb-3" />
        <p className="text-sm text-ink/70 font-medium mb-1">Registration pending</p>
        <p className="text-sm text-ink/60">
          Your Ambassador registration is awaiting admin approval. We&apos;ll
          notify you once it&apos;s reviewed.
        </p>
      </div>
    );
  }

  if (ambassador.status === "rejected") {
    return (
      <div className="ornate-card p-8 text-center">
        <XCircle className="h-8 w-8 text-danger mx-auto mb-3" />
        <p className="text-sm text-ink/70 font-medium mb-1">Registration not approved</p>
        <p className="text-sm text-ink/60">
          Your registration wasn&apos;t approved. Contact the admin team for details.
        </p>
      </div>
    );
  }

  const progressPct =
    ambassador.chosenTarget > 0
      ? Math.min(100, Math.round((ambassador.raisedAmount / ambassador.chosenTarget) * 100))
      : 0;

  return (
    <div className="ornate-card p-6 sm:p-7">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="h-5 w-5 text-emerald-deep" />
        <p className="text-sm font-medium text-ink">
          You&apos;re an approved Ambassador
          {ambassador.isIhsanLevel && (
            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber/15 text-amber">
              Ihsan-level
            </span>
          )}
        </p>
      </div>
      <div className="h-3 rounded-full bg-surface-2 overflow-hidden border border-border mb-2">
        <div
          className="h-full bg-emerald rounded-full transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="text-sm text-ink/60 mb-6">
        {DRIVE_CURRENCY} {ambassador.raisedAmount.toLocaleString()} raised of{" "}
        {DRIVE_CURRENCY} {ambassador.chosenTarget.toLocaleString()} target
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/drive/ambassador/instructions" className="btn-secondary flex-1 justify-center">
          <FileText className="h-4 w-4" />
          Sharing instructions
        </Link>
        {ambassador.certificateIssuedAt && (
          <Link href="/drive/ambassador/certificate" className="btn-primary flex-1 justify-center">
            <Award className="h-4 w-4" />
            View certificate
          </Link>
        )}
      </div>
    </div>
  );
}
