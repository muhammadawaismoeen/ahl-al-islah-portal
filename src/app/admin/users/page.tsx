import type { Metadata } from "next";
import { isAuthenticated, bootstrapOwnerEmails } from "@/app/admin/actions";
import { listAdminUsers } from "@/lib/admin-users-store";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { AddAdminUserForm, AdminUsersTable, BootstrapOwnersNotice } from "./UsersConsole";

export const metadata: Metadata = {
  title: "Admin · Users & Roles",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const authed = await isAuthenticated();

  if (!authed) {
    return <AdminLoginScreen subtitle="Users & roles. Owner only." />;
  }

  const [users, bootstrapEmails] = await Promise.all([listAdminUsers(), bootstrapOwnerEmails()]);

  return (
    <AdminShell section="users">
      <div>
        <div className="mb-8">
          <span className="arabic-text text-emerald-deep">المستخدمون والصلاحيات</span>
          <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
            Users &amp; Roles
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            Grant admins access to just the sections their role needs. Owners see everything,
            including this page.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="space-y-3">
            <BootstrapOwnersNotice emails={bootstrapEmails} />
            <AdminUsersTable users={users} />
          </div>
          <AddAdminUserForm />
        </div>
      </div>
    </AdminShell>
  );
}
