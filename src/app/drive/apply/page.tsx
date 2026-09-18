import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, GraduationCap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { auth } from "@/lib/auth";
import { getActiveDrive, listDriveItems } from "@/lib/drive-store";
import { isCollegeEmail, COLLEGE_EMAIL_DOMAIN } from "@/lib/drive-config";
import { ApplyForm } from "./ApplyForm";

export const metadata: Metadata = {
  title: "Apply for a Book — Qur'an & Seerah Drive",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DriveApplyPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    redirect(`/drive/signin?callbackUrl=${encodeURIComponent("/drive/apply")}`);
  }
  const eligible = isCollegeEmail(email);

  const content = await getContent();
  const drive = eligible ? await getActiveDrive() : null;
  const items = drive ? await listDriveItems(drive.id) : [];

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-2xl mx-auto">
          <Link
            href="/drive"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-6 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the Drive
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <BookOpen className="h-7 w-7 text-emerald-deep" />
            </div>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Apply for a Book
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              Choose an item from the current drive. You&apos;ll get a pickup
              ticket with a QR code right after.
            </p>
          </div>

          {!eligible ? (
            <div className="ornate-card p-8 text-center">
              <GraduationCap className="h-8 w-8 text-ink/25 mx-auto mb-3" />
              <p className="text-sm text-ink/70 font-medium mb-1">
                Use your official college email
              </p>
              <p className="text-sm text-ink/60 mb-4">
                Book applications are only open to Akhtar Saeed Medical and
                Dental College student accounts ({COLLEGE_EMAIL_DOMAIN}).
                You&apos;re signed in as <strong>{email}</strong>.
              </p>
              <Link
                href={`/drive/signin?switch=1&callbackUrl=${encodeURIComponent("/drive/apply")}`}
                className="btn-secondary inline-flex"
              >
                Switch Google account
              </Link>
            </div>
          ) : !drive ? (
            <div className="ornate-card p-8 text-center">
              <p className="text-sm text-ink/60">
                There&apos;s no open drive right now — check back soon, or{" "}
                <Link href="/drive/donate" className="text-emerald-deep hover:underline">
                  donate to the general fund
                </Link>
                .
              </p>
            </div>
          ) : !drive.applicationsOpen ? (
            <div className="ornate-card p-8 text-center">
              <p className="text-sm text-ink/60">
                We&apos;ll open applications soon. In the meantime, you can{" "}
                <Link href="/drive/donate" className="text-emerald-deep hover:underline">
                  donate to the general fund
                </Link>
                .
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="ornate-card p-8 text-center">
              <p className="text-sm text-ink/60">
                This drive&apos;s catalog isn&apos;t published yet — check back soon.
              </p>
            </div>
          ) : (
            <ApplyForm
              driveId={drive.id}
              items={items}
              reserveButtonLabel={content.drive.reserveButtonLabel}
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
