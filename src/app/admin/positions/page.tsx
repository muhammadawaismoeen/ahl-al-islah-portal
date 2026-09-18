import type { Metadata } from "next";
import { isAuthenticated } from "@/app/admin/actions";
import { getContent } from "@/lib/content-store";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { PositionsEditor } from "./PositionsEditor";

export const metadata: Metadata = {
  title: "Admin · Positions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPositionsPage() {
  const authed = await isAuthenticated();

  if (!authed) {
    return <AdminLoginScreen subtitle="Positions editor. Advisor only." />;
  }

  const content = await getContent();

  return (
    <AdminShell section="programming">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="arabic-text text-emerald-deep">المناصب</span>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Positions
            </h1>
            <p className="text-sm text-ink/60 mt-1">
              Open, close, and edit leadership &amp; membership positions.
              Changes are live immediately after saving.
            </p>
          </div>
        </div>

        <PositionsEditor initialPositions={content.positions} />
      </div>
    </AdminShell>
  );
}
