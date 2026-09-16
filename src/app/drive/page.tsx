import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MapPin, CalendarDays, HandCoins, Library, HeartHandshake } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { getActiveDrive, computeDriveStats } from "@/lib/drive-store";
import { DRIVE_COPY, DRIVE_CURRENCY } from "@/lib/drive-config";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Qur'an & Seerah Drive — Ahl Al-Islah",
  description:
    "Sponsor and receive Qur'an and Seerah books through the Ahl Al-Islah Drive — apply for a copy or donate to fund the next print run.",
};

export const dynamic = "force-dynamic";

export default async function DrivePage() {
  const [content, drive, stats] = await Promise.all([
    getContent(),
    getActiveDrive(),
    computeDriveStats(),
  ]);

  const goal = drive?.goalAmount ?? 0;
  const raised = drive?.raisedAmount ?? 0;
  const progressPct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <BookOpen className="h-7 w-7 text-emerald-deep" />
            </div>
            <span className="arabic-text block text-emerald-deep text-lg mb-1">
              {DRIVE_COPY.landingHeroEyebrow}
            </span>
            <h1 className="heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep">
              {drive?.name ?? DRIVE_COPY.landingHeroTitle}
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              {DRIVE_COPY.landingTagline}
            </p>

            {drive ? (
              <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 text-xs text-ink/55">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-deep" />
                  {formatDate(drive.startDate)} – {formatDate(drive.endDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-deep" />
                  {drive.pickupLocation}
                </span>
              </div>
            ) : (
              <p className="mt-4 text-xs text-ink/50 bg-surface-2 inline-block px-3 py-1.5 rounded-full border border-border">
                {DRIVE_COPY.pickupInfoFallback}
              </p>
            )}
          </div>

          {/* Progress */}
          {drive && (
            <div className="ornate-card p-6 sm:p-7 mb-8">
              <div className="flex items-end justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-ink/75">Raised so far</p>
                <p className="text-sm font-semibold text-emerald-deep">
                  {progressPct}%
                </p>
              </div>
              <div className="h-3 rounded-full bg-surface-2 overflow-hidden border border-border">
                <div
                  className="h-full bg-emerald rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-ink/60">
                {DRIVE_CURRENCY} {raised.toLocaleString()} of {DRIVE_CURRENCY}{" "}
                {goal.toLocaleString()} goal
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link href="/drive/apply" className="btn-primary">
              <BookOpen className="h-4 w-4" />
              {DRIVE_COPY.applyCtaLabel}
            </Link>
            <Link href="/drive/donate" className="btn-secondary">
              <HandCoins className="h-4 w-4" />
              {DRIVE_COPY.donateCtaLabel}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatChip
              icon={<Library className="h-5 w-5 text-emerald-deep" />}
              value={stats.booksGivenAllTime}
              label={DRIVE_COPY.statBooksLabel}
            />
            <StatChip
              icon={<CalendarDays className="h-5 w-5 text-emerald-deep" />}
              value={stats.drivesRun}
              label={DRIVE_COPY.statDrivesLabel}
            />
            <StatChip
              icon={<HeartHandshake className="h-5 w-5 text-emerald-deep" />}
              value={`${DRIVE_CURRENCY} ${stats.generalFundTotal.toLocaleString()}`}
              label={DRIVE_COPY.statFundLabel}
            />
          </div>

          <p className="mt-10 text-center text-xs text-ink/45">
            Already applied or donated?{" "}
            <Link href="/drive/me" className="text-emerald-deep hover:underline">
              View your Drive records
            </Link>
          </p>
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

function StatChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="ornate-card p-5 text-center">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-deep/10 mb-3">
        {icon}
      </div>
      <div className="font-serif text-2xl font-semibold text-emerald-deep">
        {value}
      </div>
      <div className="mt-1 text-xs text-ink/60 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
