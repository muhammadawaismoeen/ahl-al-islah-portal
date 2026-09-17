import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, HandCoins, CheckCircle2, Clock3, PackageCheck, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { auth } from "@/lib/auth";
import { getDriveDeviceIds } from "@/lib/drive-session";
import {
  getApplication,
  getDonation,
  getDrive,
  getDriveItem,
  listApplicationsByEmail,
  listDonationsByEmail,
} from "@/lib/drive-store";
import type { ApplicationStatus, DonationStatus } from "@/lib/drive-types";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import { formatDate } from "@/lib/utils";
import { DriveClaimGate } from "./DriveClaimGate";

export const metadata: Metadata = {
  title: "My Drive Records — Ahl Al-Islah",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const APP_STATUS: Record<
  ApplicationStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  "pending-review": { label: "Pending review", className: "bg-sapphire/15 text-sapphire", icon: Clock3 },
  confirmed: { label: "Confirmed", className: "bg-emerald-deep/15 text-emerald-deep", icon: CheckCircle2 },
  waitlisted: { label: "Waitlisted", className: "bg-amber/15 text-amber", icon: Clock3 },
  "picked-up": { label: "Picked up", className: "bg-ink/15 text-ink/70", icon: PackageCheck },
};

const DONATION_STATUS: Record<
  DonationStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  pending: { label: "Pending review", className: "bg-amber/15 text-amber", icon: Clock3 },
  verified: { label: "Verified", className: "bg-emerald-deep/15 text-emerald-deep", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-danger-100 text-danger-700", icon: XCircle },
};

export default async function DriveMePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [content, ids, session, { tab: tabParam }] = await Promise.all([
    getContent(),
    getDriveDeviceIds(),
    auth(),
    searchParams,
  ]);
  const tab = tabParam === "donations" ? "donations" : "applications";
  const email = session?.user?.email;

  // Hybrid lookup: device cookie covers records from before Google sign-in
  // was mandatory, email covers everything since — merged and de-duped so
  // nobody's history disappears going forward.
  const [byCookieApps, byEmailApps, byCookieDonations, byEmailDonations] =
    await Promise.all([
      Promise.all(ids.applications.map((id) => getApplication(id))),
      email ? listApplicationsByEmail(email) : Promise.resolve([]),
      Promise.all(ids.donations.map((id) => getDonation(id))),
      email ? listDonationsByEmail(email) : Promise.resolve([]),
    ]);

  const applications = dedupeById([...byCookieApps, ...byEmailApps]).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
  const donations = dedupeById([...byCookieDonations, ...byEmailDonations]).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  const [appDrives, appItems] = await Promise.all([
    Promise.all(applications.map((a) => getDrive(a.driveId))),
    Promise.all(applications.map((a) => getDriveItem(a.itemId))),
  ]);
  const donationDrives = await Promise.all(
    donations.map((d) => (d.driveId ? getDrive(d.driveId) : Promise.resolve(null)))
  );

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              My Drive Records
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              Applications and donations recognised on this device.
            </p>
          </div>

          <div className="flex border-b border-border mb-6">
            <Link
              href="/drive/me?tab=applications"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                tab === "applications"
                  ? "border-emerald-deep text-emerald-deep"
                  : "border-transparent text-ink/55 hover:text-emerald-deep"
              }`}
            >
              Applications ({applications.length})
            </Link>
            <Link
              href="/drive/me?tab=donations"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                tab === "donations"
                  ? "border-emerald-deep text-emerald-deep"
                  : "border-transparent text-ink/55 hover:text-emerald-deep"
              }`}
            >
              Donations ({donations.length})
            </Link>
          </div>

          {tab === "applications" ? (
            applications.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-8 w-8 text-ink/25" />}
                message="No book applications on this device yet."
                ctaHref="/drive/apply"
                ctaLabel="Apply for a Book"
              />
            ) : (
              <ul className="space-y-3">
                {applications.map((a, i) => {
                  const status = APP_STATUS[a.status];
                  const Icon = status.icon;
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/drive/applications/${a.id}`}
                        className="ornate-card p-5 flex items-center justify-between gap-4 hover:border-emerald-deep/30 transition"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-ink truncate">
                            {appItems[i]?.name ?? "Item"}
                          </p>
                          <p className="text-xs text-ink/50 mt-0.5">
                            {appDrives[i]?.name} · {formatDate(a.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${status.className}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )
          ) : donations.length === 0 ? (
            <EmptyState
              icon={<HandCoins className="h-8 w-8 text-ink/25" />}
              message="No donations on this device yet."
              ctaHref="/drive/donate"
              ctaLabel="Donate"
            />
          ) : (
            <ul className="space-y-3">
              {donations.map((d, i) => {
                const status = DONATION_STATUS[d.status];
                const Icon = status.icon;
                return (
                  <li key={d.id} className="ornate-card p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-ink">
                        {DRIVE_CURRENCY} {d.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {donationDrives[i]?.name ?? "General fund"} ·{" "}
                        {formatDate(d.createdAt)} ·{" "}
                        <code className="font-mono">{d.refCode}</code>
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${status.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-8">
            <DriveClaimGate />
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

function dedupeById<T extends { id: string } | null>(
  records: T[]
): NonNullable<T>[] {
  const seen = new Map<string, NonNullable<T>>();
  for (const r of records) {
    if (r) seen.set(r.id, r as NonNullable<T>);
  }
  return Array.from(seen.values());
}

function EmptyState({
  icon,
  message,
  ctaHref,
  ctaLabel,
}: {
  icon: React.ReactNode;
  message: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="ornate-card p-10 text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-surface-2 mb-4">
        {icon}
      </div>
      <p className="text-sm text-ink/60 mb-4">{message}</p>
      <Link href={ctaHref} className="btn-secondary">
        {ctaLabel}
      </Link>
    </div>
  );
}
