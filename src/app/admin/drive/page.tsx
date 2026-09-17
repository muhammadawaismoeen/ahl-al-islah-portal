import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Library,
  Users,
  ScanLine,
  HandCoins,
  BarChart3,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated, adminSignIn } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";
import {
  listDrives,
  listDriveItems,
  listApplications,
  listDonations,
} from "@/lib/drive-store";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import { formatDate } from "@/lib/utils";
import {
  CreateDriveForm,
  DriveStatusToggle,
  DriveGoalForm,
  CreateItemForm,
  ItemStockForm,
  ApplicantsPanel,
  CheckInForm,
  DonationsPanel,
} from "./DriveConsoleActions";
import { FinancialReport } from "./FinancialReport";

export const metadata: Metadata = {
  title: "Qur'an & Seerah Drive — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Tab = "drives" | "catalog" | "applicants" | "checkin" | "donations" | "report";

const TABS: { key: Tab; label: string; icon: typeof BookOpen }[] = [
  { key: "drives", label: "Drives", icon: BookOpen },
  { key: "catalog", label: "Catalog", icon: Library },
  { key: "applicants", label: "Applicants", icon: Users },
  { key: "checkin", label: "Check-in", icon: ScanLine },
  { key: "donations", label: "Donations", icon: HandCoins },
  { key: "report", label: "Financial Report", icon: BarChart3 },
];

export default async function AdminDrivePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container-prose max-w-md mx-auto">
            <div className="ornate-card p-8">
              <div className="text-center mb-6">
                <span className="arabic-text text-emerald-deep">لوحة الإدارة</span>
                <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">
                  Admin Access
                </h1>
              </div>
              <LoginForm action={adminSignIn} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : "drives";

  const [drives, items, applications, donations] = await Promise.all([
    listDrives(),
    listDriveItems(),
    listApplications(),
    listDonations(),
  ]);
  const driveById = new Map(drives.map((d) => [d.id, d]));
  const driveNameById = Object.fromEntries(drives.map((d) => [d.id, d.name]));
  const itemNameById = Object.fromEntries(items.map((i) => [i.id, i.name]));
  const pendingDonations = donations.filter((d) => d.status === "pending").length;

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-2 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Core Members
              </Link>
              <span className="arabic-text block text-emerald-deep">القرآن والسيرة</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Qur&apos;an &amp; Seerah Drive
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.key === tab;
              return (
                <Link
                  key={t.key}
                  href={`/admin/drive?tab=${t.key}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition relative ${
                    active
                      ? "bg-emerald-deep text-white"
                      : "bg-border text-ink/60 hover:bg-emerald-deep/10 hover:text-emerald-deep"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  {t.key === "donations" && pendingDonations > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber text-white text-[9px] font-bold flex items-center justify-center">
                      {pendingDonations}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {tab === "drives" && (
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
              <div className="space-y-3">
                {drives.length === 0 ? (
                  <div className="ornate-card p-10 text-center">
                    <p className="text-sm text-ink/60">No drives yet.</p>
                  </div>
                ) : (
                  drives.map((d) => (
                    <div key={d.id} className="ornate-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-medium text-ink">{d.name}</p>
                          <p className="text-xs text-ink/50 mt-0.5">
                            {formatDate(d.startDate)} – {formatDate(d.endDate)} ·{" "}
                            {d.pickupLocation}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              d.status === "open"
                                ? "bg-emerald-deep/15 text-emerald-deep"
                                : "bg-ink/15 text-ink/60"
                            }`}
                          >
                            {d.status === "open" ? "Open" : "Closed"}
                          </span>
                          <DriveStatusToggle drive={d} />
                        </div>
                      </div>
                      <p className="text-sm text-ink/70 mb-2">
                        {DRIVE_CURRENCY} {d.raisedAmount.toLocaleString()} raised of{" "}
                        {DRIVE_CURRENCY} {d.goalAmount.toLocaleString()} goal
                      </p>
                      <DriveGoalForm drive={d} />
                    </div>
                  ))
                )}
              </div>
              <CreateDriveForm />
            </div>
          )}

          {tab === "catalog" && (
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="ornate-card p-10 text-center">
                    <p className="text-sm text-ink/60">No catalog items yet.</p>
                  </div>
                ) : (
                  items.map((i) => (
                    <div key={i.id} className="ornate-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-medium text-ink">{i.name}</p>
                          <p className="text-xs text-ink/50 mt-0.5">
                            {driveById.get(i.driveId)?.name ?? "Unknown drive"}
                          </p>
                        </div>
                      </div>
                      <ItemStockForm
                        itemId={i.id}
                        totalStock={i.totalStock}
                        remainingStock={i.remainingStock}
                        perStudentLimit={i.perStudentLimit}
                      />
                    </div>
                  ))
                )}
              </div>
              <CreateItemForm drives={drives} />
            </div>
          )}

          {tab === "applicants" && (
            <ApplicantsPanel
              applications={applications}
              itemNameById={itemNameById}
              driveNameById={driveNameById}
            />
          )}

          {tab === "checkin" && (
            <div className="max-w-lg">
              <CheckInForm />
            </div>
          )}

          {tab === "donations" && (
            <DonationsPanel donations={donations} driveNameById={driveNameById} />
          )}

          {tab === "report" && (
            <FinancialReport donations={donations} drives={drives} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
