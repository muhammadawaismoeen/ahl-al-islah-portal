import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Library,
  Users,
  ScanLine,
  HandCoins,
  BarChart3,
  Award,
  Wallet,
} from "lucide-react";
import { isAuthenticated, getFeaturePermission } from "@/app/admin/actions";
import { canEdit, canDelete } from "@/lib/admin-permissions";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { FeatureRestricted, ReadOnlyBanner } from "@/components/admin/FeatureGate";
import {
  listDrives,
  listDriveItems,
  listApplications,
  listDonations,
  listAmbassadors,
} from "@/lib/drive-store";
import { getDriveSettings } from "@/lib/drive-settings";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import { formatDate } from "@/lib/utils";
import {
  CreateDriveForm,
  DriveStatusToggle,
  ApplicationsToggle,
  DriveGoalForm,
  DeleteDriveButton,
  CreateItemForm,
  ItemStockForm,
  DeleteDriveItemButton,
  ApplicantsPanel,
  CheckInForm,
  DonationsPanel,
} from "./DriveConsoleActions";
import {
  AmbassadorsPanel,
  IhsanPercentageForm,
  AddPaymentMethodForm,
  PaymentMethodsList,
} from "./AmbassadorPaymentPanels";
import { FinancialReport } from "./FinancialReport";

export const metadata: Metadata = {
  title: "Qur'an & Seerah Drive — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Tab =
  | "drives"
  | "catalog"
  | "applicants"
  | "checkin"
  | "donations"
  | "ambassadors"
  | "payments"
  | "report";

const TAB_FEATURE: Record<Tab, Parameters<typeof getFeaturePermission>[0]> = {
  drives: "drive.drives",
  catalog: "drive.catalog",
  applicants: "drive.applicants",
  checkin: "drive.checkin",
  donations: "drive.donations",
  ambassadors: "drive.ambassadors",
  payments: "drive.payments",
  report: "drive.report",
};

const TABS: { key: Tab; label: string; icon: typeof BookOpen }[] = [
  { key: "drives", label: "Drives", icon: BookOpen },
  { key: "catalog", label: "Catalog", icon: Library },
  { key: "applicants", label: "Applicants", icon: Users },
  { key: "checkin", label: "Check-in", icon: ScanLine },
  { key: "donations", label: "Donations", icon: HandCoins },
  { key: "ambassadors", label: "Ambassadors", icon: Award },
  { key: "payments", label: "Payment Settings", icon: Wallet },
  { key: "report", label: "Financial Report", icon: BarChart3 },
];

export default async function AdminDrivePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return <AdminLoginScreen />;
  }

  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : "drives";

  const tier = await getFeaturePermission(TAB_FEATURE[tab]);
  if (tier === "none") {
    return (
      <AdminShell section="drive">
        <FeatureRestricted />
      </AdminShell>
    );
  }
  const tabCanEdit = canEdit(tier);
  const tabCanDelete = canDelete(tier);

  const [drives, items, applications, donations, ambassadors, driveSettings] =
    await Promise.all([
      listDrives(),
      listDriveItems(),
      listApplications(),
      listDonations(),
      listAmbassadors(),
      getDriveSettings(),
    ]);
  const driveById = new Map(drives.map((d) => [d.id, d]));
  const driveNameById = Object.fromEntries(drives.map((d) => [d.id, d.name]));
  const pendingDonations = donations.filter((d) => d.status === "pending").length;
  const pendingAmbassadors = ambassadors.filter((a) => a.status === "pending").length;

  return (
    <AdminShell section="drive">
      <div>
          {tier === "read" && <ReadOnlyBanner />}

          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
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
                  {t.key === "ambassadors" && pendingAmbassadors > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber text-white text-[9px] font-bold flex items-center justify-center">
                      {pendingAmbassadors}
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
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-medium text-ink">{d.name}</p>
                          <p className="text-xs text-ink/50 mt-0.5">
                            {formatDate(d.startDate)} – {formatDate(d.endDate)} ·{" "}
                            {d.pickupLocation}
                          </p>
                        </div>
                        {tabCanDelete && <DeleteDriveButton driveId={d.id} driveName={d.name} />}
                      </div>
                      <p className="text-sm text-ink/70 mb-3">
                        {DRIVE_CURRENCY} {d.raisedAmount.toLocaleString()} raised of{" "}
                        {DRIVE_CURRENCY} {d.goalAmount.toLocaleString()} goal
                      </p>
                      <div className="space-y-2 mb-3">
                        <DriveStatusToggle drive={d} canEdit={tabCanEdit} />
                        <ApplicationsToggle drive={d} canEdit={tabCanEdit} />
                      </div>
                      <DriveGoalForm drive={d} canEdit={tabCanEdit} />
                    </div>
                  ))
                )}
              </div>
              {tabCanEdit && <CreateDriveForm />}
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
                        {tabCanDelete && (
                          <DeleteDriveItemButton itemId={i.id} itemName={i.name} />
                        )}
                      </div>
                      <ItemStockForm
                        itemId={i.id}
                        totalStock={i.totalStock}
                        remainingStock={i.remainingStock}
                        perStudentLimit={i.perStudentLimit}
                        canEdit={tabCanEdit}
                      />
                    </div>
                  ))
                )}
              </div>
              {tabCanEdit && <CreateItemForm drives={drives} />}
            </div>
          )}

          {tab === "applicants" && (
            <ApplicantsPanel
              applications={applications}
              items={items}
              driveNameById={driveNameById}
              canEdit={tabCanEdit}
            />
          )}

          {tab === "checkin" && (
            <div className="max-w-lg">
              <CheckInForm canEdit={tabCanEdit} />
            </div>
          )}

          {tab === "donations" && (
            <DonationsPanel
              donations={donations}
              driveNameById={driveNameById}
              canEdit={tabCanEdit}
              canDelete={tabCanDelete}
            />
          )}

          {tab === "ambassadors" && (
            <AmbassadorsPanel
              ambassadors={ambassadors}
              driveNameById={driveNameById}
              canEdit={tabCanEdit}
              canDelete={tabCanDelete}
            />
          )}

          {tab === "payments" && (
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
              <PaymentMethodsList methods={driveSettings.paymentMethods} canDelete={tabCanDelete} />
              <div className="space-y-6">
                {tabCanEdit && <AddPaymentMethodForm />}
                <IhsanPercentageForm
                  ihsanPercentage={driveSettings.ihsanPercentage}
                  canEdit={tabCanEdit}
                />
              </div>
            </div>
          )}

          {tab === "report" && (
            <FinancialReport donations={donations} drives={drives} />
          )}
      </div>
    </AdminShell>
  );
}
