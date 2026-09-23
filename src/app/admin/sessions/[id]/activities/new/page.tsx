import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isAuthenticated, getFeaturePermission } from "@/app/admin/actions";
import { canEdit } from "@/lib/admin-permissions";
import { getSession } from "@/lib/sessions-store";
import { addActivityAction } from "../../../actions";
import { ActivityForm } from "../../../ActivityForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { FeatureRestricted } from "@/components/admin/FeatureGate";

export const metadata: Metadata = {
  title: "New Activity — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewActivityPage({ params }: Props) {
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

  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const boundAction = addActivityAction.bind(null, session.id);

  return (
    <AdminShell section="programming">
      <div className="max-w-3xl mx-auto">
          <Link
            href={`/admin/sessions/${session.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-4 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to{" "}
            <span className="font-medium">{session.title}</span>
          </Link>
          <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mb-1">
            New Activity
          </h1>
          <p className="text-sm text-ink/60 mb-8">
            Adding to{" "}
            <span className="font-medium text-emerald-deep">{session.title}</span>.
          </p>

          <ActivityForm action={boundAction} submitLabel="Add activity" />
      </div>
    </AdminShell>
  );
}
