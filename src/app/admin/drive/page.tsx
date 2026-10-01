import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Library,
  Users,
  ScanLine,
  PackageCheck,
  HandCoins,
  BarChart3,
  Award,
  Wallet,
} from "lucide-react";
import { isAuthenticated, getFeaturePermissions, getAdminRole } from "@/app/admin/actions";
import { canRead, canEdit, canDelete } from "@/lib/admin-permissions";
import type { AdminFeature, PermissionTier } from "@/lib/admin-types";
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
import type { DriveSettings } from "@/lib/drive-types";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import { formatDriveDateLabel } from "@/lib/utils";
import {
  CreateDriveForm,
  DriveStatusToggle,
  ApplicationsToggle,
  DriveGoalForm,
  DriveDetailsForm,
  DeleteDriveButton,
  CreateItemForm,
  ItemNameForm,
  ItemStockForm,
  DeleteDriveItemButton,
  ApplicantsPanel,
  DeskScanner,
  DonationsPanel,
} from "./DriveConsoleActions";
import {
  AmbassadorsPanel,
  IhsanPercentageForm,
  SupervisorPinForm,
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
  | "handover"
  | "donations"
  | "ambassadors"
  | "payments"
  | "report";

const TAB_FEATURE: Record<Tab, AdminFeature> = {
  drives: "drive.drives",
  catalog: "drive.catalog",
  applicants: "drive.applicants",
  checkin: "drive.checkin",
  handover: "drive.handover",
  donations: "drive.donations",
  ambassadors: "drive.ambassadors",
  payments: "drive.payments",
  report: "drive.report",
};

const TABS: { key: Tab; label: string; icon: typeof BookOpen }[] = [
  { key: "drives", label: "Drives", icon: BookOpen },
  { key: "catalog", label: "Catalog", icon: Library },
  { key: "applicants", label: "Applicants", icon: Users },
  { key: "checkin", label: "Registration", icon: ScanLine },
  { key: "handover", label: "Book Handover", icon: PackageCheck },
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

  // Every tab's tier in one store read, because the tab strip itself is now
  // permission-filtered: a Drive Day desk volunteer should see only their own
  // desk, not eight chips that all land on "Restricted".
  const tiers = (await getFeaturePermissions(
    TABS.map((t) => TAB_FEATURE[t.key])
  )) as Record<AdminFeature, PermissionTier>;
  const visibleTabs = TABS.filter((t) => canRead(tiers[TAB_FEATURE[t.key]]));

  const { tab: tabParam } = await searchParams;
  // Fall back to the first tab this role can actually open, not a hardcoded
  // "drives" — a desk volunteer has no access to that one at all.
  const tab: Tab | undefined = visibleTabs.some((t) => t.key === tabParam)
    ? (tabParam as Tab)
    : visibleTabs[0]?.key;

  const tier = tab ? tiers[TAB_FEATURE[tab]] : "none";
  if (!tab || tier === "none") {
    return (
      <AdminShell section="drive">
        <FeatureRestricted />
      </AdminShell>
    );
  }
  const tabCanEdit = canEdit(tier);
  const tabCanDelete = canDelete(tier);

  // Load only what the open tab (and its badges) actually render. The desk
  // scanners need none of it, and they re-render this page after every
  // single scan — on Drive Day that is the hottest path in the console.
  const needsDonations =
    tab === "donations" ||
    tab === "report" ||
    visibleTabs.some((t) => t.key === "donations");
  const needsAmbassadors =
    tab === "ambassadors" || visibleTabs.some((t) => t.key === "ambassadors");
  const isDesk = tab === "checkin" || tab === "handover";

  const [drives, items, applications, donations, ambassadors, driveSettings] =
    await Promise.all([
      isDesk ? [] : listDrives(),
      tab === "catalog" || tab === "applicants" ? listDriveItems() : [],
      tab === "applicants" ? listApplications() : [],
      needsDonations ? listDonations() : [],
      needsAmbassadors ? listAmbassadors() : [],
      tab === "payments"
        ? getDriveSettings()
        : ({ ihsanPercentage: 0, paymentMethods: [] } as DriveSettings),
    ]);
  const driveById = new Map(drives.map((d) => [d.id, d]));
  const driveNameById = Object.fromEntries(drives.map((d) => [d.id, d.name]));
  // listDrives() already sorts most-recently-created first — reuse that
  // order to group the Applicants tab's per-item tabs by drive recency,
  // without disturbing the Catalog tab's own item ordering.
  const driveOrderIndex = new Map(drives.map((d, i) => [d.id, i]));
  const itemsByDriveRecency = [...items].sort(
    (a, b) =>
      (driveOrderIndex.get(a.driveId) ?? Infinity) -
      (driveOrderIndex.get(b.driveId) ?? Infinity)
  );
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
            {visibleTabs.map((t) => {
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
                            Drive Day: {formatDriveDateLabel(d.pickupDate, d.startDate, d.endDate)} ·{" "}
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
                      <div className="flex flex-col gap-2 items-start">
                        <DriveGoalForm drive={d} canEdit={tabCanEdit} />
                        <DriveDetailsForm drive={d} canEdit={tabCanEdit} />
                      </div>
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
                        <div className="min-w-0">
                          <ItemNameForm
                            itemId={i.id}
                            name={i.name}
                            canEdit={tabCanEdit}
                          />
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
              items={itemsByDriveRecency}
              driveNameById={driveNameById}
              canEdit={tabCanEdit}
              canDelete={tabCanDelete}
            />
          )}

          {tab === "checkin" && (
            <div className="max-w-lg">
              <DeskScanner mode="registration" canEdit={tabCanEdit} />
            </div>
          )}

          {tab === "handover" && (
            <div className="max-w-lg">
              <DeskScanner mode="handover" canEdit={tabCanEdit} />
            </div>
          )}

          {tab === "donations" && (
            <DonationsPanel
              donations={donations}
              drives={drives}
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
                <SupervisorPinForm
                  supervisorPin={driveSettings.supervisorPin}
                  isOwner={(await getAdminRole()) === "owner"}
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
