import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Award } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { auth } from "@/lib/auth";
import { listAmbassadorsByEmail, getDrive } from "@/lib/drive-store";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "../PrintButton";

export const metadata: Metadata = {
  title: "Ambassador Certificate — Ahl Al-Islah",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AmbassadorCertificatePage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    redirect(`/drive/signin?callbackUrl=${encodeURIComponent("/drive/ambassador/certificate")}`);
  }

  const content = await getContent();
  const registrations = await listAmbassadorsByEmail(email);
  const ambassador = registrations.find((a) => a.status === "approved" && a.certificateIssuedAt);

  if (!ambassador) {
    return (
      <>
        <Navbar content={content.nav} customLogo={content.customLogo} />
        <main className="pt-32 pb-20">
          <div className="container-prose max-w-lg mx-auto text-center">
            <div className="ornate-card p-8">
              <p className="text-sm text-ink/60">
                Your certificate unlocks once your verified donations reach your committed target.
              </p>
              <Link href="/drive/ambassador" className="btn-secondary inline-flex mt-4">
                Back to Ambassador page
              </Link>
            </div>
          </div>
        </main>
        <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
      </>
    );
  }

  const drive = await getDrive(ambassador.driveId);

  return (
    <>
      <div className="print:hidden">
        <Navbar content={content.nav} customLogo={content.customLogo} />
      </div>
      <main className="pt-32 pb-20 print:pt-0">
        <div className="container-prose max-w-2xl mx-auto">
          <Link
            href="/drive/ambassador"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-6 transition print:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Ambassador page
          </Link>

          <div className="ornate-card p-10 sm:p-14 text-center border-double border-4 border-emerald-deep/30 print:border-emerald-deep/60">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50 mb-6">
              Certificate of Achievement
            </p>

            <Award className="h-12 w-12 text-emerald-deep mx-auto mb-6" />

            <p className="text-sm text-ink/60 mb-2">This certifies that</p>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep mb-2">
              {ambassador.name}
            </h1>
            <p className="text-sm text-ink/60 max-w-md mx-auto leading-relaxed">
              served as a Drive Ambassador for the{" "}
              <strong>{drive?.name ?? "Qur'an & Seerah Drive"}</strong> and
              successfully reached a donation target of{" "}
              <strong>
                {DRIVE_CURRENCY} {ambassador.chosenTarget.toLocaleString()}
              </strong>
              {ambassador.isIhsanLevel && " at the Ihsan level"}.
            </p>

            <div className="gold-divider my-8" />

            <div className="flex items-center justify-center gap-8 text-xs text-ink/50">
              <div>
                <p className="font-medium text-ink/70">
                  {formatDate(ambassador.certificateIssuedAt!)}
                </p>
                <p>Date issued</p>
              </div>
              <div>
                <p className="font-medium text-ink/70">
                  {DRIVE_CURRENCY} {ambassador.raisedAmount.toLocaleString()}
                </p>
                <p>Total raised</p>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <div className="text-center">
                <p className="font-signature text-3xl text-emerald-deep leading-none">
                  Muhammad Awais Moeen
                </p>
                <div className="w-44 mx-auto border-t border-ink/20 mt-2 pt-1.5">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-ink/50">
                    Advisor
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-ink/40">Ahl Al-Islah</p>
          </div>

          <div className="mt-8 flex justify-center print:hidden">
            <PrintButton label="Save certificate as PDF" />
          </div>
        </div>
      </main>
      <div className="print:hidden">
        <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
      </div>
    </>
  );
}
