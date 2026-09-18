import { auth } from "@/lib/auth";
import { logout, getAdminRole } from "@/app/admin/actions";
import { listMessages } from "@/lib/message-store";
import { listFeedback } from "@/lib/feedback-store";
import { listSubmissions as listActivitySubmissions } from "@/lib/activity-submissions-store";
import { listThreads as listCounselThreads } from "@/lib/counsel-store";
import { listDonations as listDriveDonations } from "@/lib/drive-store";
import { roleHasSection } from "@/lib/admin-permissions";
import type { AdminSection } from "@/lib/admin-types";
import { AdminSidebar } from "./AdminSidebar";
import { ShieldAlert } from "lucide-react";

export async function AdminShell({
  section,
  children,
}: {
  section: AdminSection;
  children: React.ReactNode;
}) {
  const [session, role, messages, feedback, activitySubmissions, counselThreads, driveDonations] =
    await Promise.all([
      auth(),
      getAdminRole(),
      listMessages(),
      listFeedback(),
      listActivitySubmissions(),
      listCounselThreads(),
      listDriveDonations(),
    ]);

  const badges = {
    messages: messages.filter((m) => m.status === "unread").length,
    feedback: feedback.filter((f) => f.status === "unread").length,
    activities: activitySubmissions.filter((a) => a.status === "unread").length,
    counsel: counselThreads.filter((t) => t.advisorHasUnread).length,
    drive: driveDonations.filter((d) => d.status === "pending").length,
  };

  const allowed = role !== null && roleHasSection(role, section);

  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar
        badges={badges}
        adminEmail={session?.user?.email}
        role={role}
        logoutAction={logout}
      />
      <div
        className="transition-[padding] duration-200 ease-out lg:pl-[var(--admin-sidebar-w,16rem)]"
      >
        <main className="pt-20 lg:pt-8 pb-16 px-4 sm:px-6 lg:px-10">
          {allowed ? (
            children
          ) : (
            <div className="max-w-md mx-auto mt-16 rounded-2xl border border-border bg-surface p-8 text-center">
              <ShieldAlert className="mx-auto h-8 w-8 text-amber" />
              <h1 className="heading-serif mt-4 text-lg font-semibold text-emerald-deep">
                Access restricted
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                Your admin role doesn&apos;t include this section. Ask an Owner to update your
                access from Users &amp; Roles if you need it.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
