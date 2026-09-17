import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isAuthenticated } from "@/app/admin/actions";
import { getSession } from "@/lib/sessions-store";
import { updateActivityAction } from "../../../actions";
import { ActivityForm } from "../../../ActivityForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";

export const metadata: Metadata = {
  title: "Edit Activity — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; activityId: string }>;
}

export default async function EditActivityPage({ params }: Props) {
  const authed = await isAuthenticated();
  if (!authed) {
    return <AdminLoginScreen />;
  }

  const { id, activityId } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  const activity = session.activities.find((a) => a.id === activityId);
  if (!activity) notFound();

  const boundAction = updateActivityAction.bind(null, session.id, activity.id);

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto">
          <Link
            href={`/admin/sessions/${session.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-4 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to{" "}
            <span className="font-medium">{session.title}</span>
          </Link>
          <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mb-1">
            Edit Activity
          </h1>
          <p className="text-sm text-ink/60 mb-8">
            Editing{" "}
            <span className="font-medium text-emerald-deep">{activity.title}</span>{" "}
            within{" "}
            <span className="font-medium text-emerald-deep">{session.title}</span>
            .
          </p>

          <ActivityForm
            action={boundAction}
            submitLabel="Save activity"
            defaults={{
              title: activity.title,
              timeMarker: activity.timeMarker ?? "",
              durationMin:
                activity.durationMin !== undefined
                  ? String(activity.durationMin)
                  : "",
              body: activity.body,
            }}
          />
      </div>
    </AdminShell>
  );
}
