import { auth } from "@/lib/auth";
import { logout } from "@/app/admin/actions";
import { listMessages } from "@/lib/message-store";
import { listFeedback } from "@/lib/feedback-store";
import { listSubmissions as listActivitySubmissions } from "@/lib/activity-submissions-store";
import { listThreads as listCounselThreads } from "@/lib/counsel-store";
import { listDonations as listDriveDonations } from "@/lib/drive-store";
import { AdminSidebar } from "./AdminSidebar";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const [session, messages, feedback, activitySubmissions, counselThreads, driveDonations] =
    await Promise.all([
      auth(),
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

  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar
        badges={badges}
        adminEmail={session?.user?.email}
        logoutAction={logout}
      />
      <div
        className="transition-[padding] duration-200 ease-out lg:pl-[var(--admin-sidebar-w,16rem)]"
      >
        <main className="pt-20 lg:pt-8 pb-16 px-4 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
