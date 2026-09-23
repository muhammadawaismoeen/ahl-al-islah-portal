import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAuthenticated, getFeaturePermission } from "@/app/admin/actions";
import { canEdit } from "@/lib/admin-permissions";
import { createSessionAction } from "../actions";
import { SessionForm } from "../SessionForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { FeatureRestricted } from "@/components/admin/FeatureGate";

export const metadata: Metadata = {
  title: "New Session — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    return <AdminLoginScreen />;
  }

  const tier = await getFeaturePermission("programming.sessions");
  if (!canEdit(tier)) {
    return (
      <AdminShell section="programming">
        <FeatureRestricted />
      </AdminShell>
    );
  }

  return (
    <AdminShell section="programming">
      <div className="max-w-2xl mx-auto">
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-4 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sessions
          </Link>
          <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mb-1">
            New Session
          </h1>
          <p className="text-sm text-ink/60 mb-8">
            Create a session, then add activities to it.
          </p>

          <div className="ornate-card p-6 sm:p-8">
            <SessionForm
              mode="create"
              action={createSessionAction}
              defaults={{
                title: "",
                arabicTitle: "",
                date: new Date().toISOString().slice(0, 10),
                startTime: "",
                endTime: "",
                meetingLink: "",
                description: "",
              }}
              cancelHref="/admin/sessions"
              submitLabel="Create session"
            />
          </div>
      </div>
    </AdminShell>
  );
}
