"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_ROLES, ADMIN_ROLE_LABEL, ADMIN_ROLE_DESCRIPTION } from "@/lib/admin-permissions";
import type { AdminRole, AdminUser } from "@/lib/admin-types";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  addAdminUserAction,
  updateAdminUserRoleAction,
  removeAdminUserAction,
} from "./actions";

export function AddAdminUserForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addAdminUserAction(formData);
      if (res.ok) {
        toast.success("Admin user added.");
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="ornate-card p-5 sm:p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">Add admin user</p>
      <div>
        <label htmlFor="email" className="label-field">Google email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input-field"
          placeholder="name@gmail.com"
        />
      </div>
      <div>
        <label htmlFor="role" className="label-field">Role</label>
        <select id="role" name="role" required defaultValue="" className="input-field">
          <option value="" disabled>
            Choose a role
          </option>
          {ADMIN_ROLES.map((role) => (
            <option key={role} value={role}>
              {ADMIN_ROLE_LABEL[role]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full !py-2.5 text-sm">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add user
      </button>
    </form>
  );
}

function RoleSelect({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(role: AdminRole) {
    setPending(true);
    const res = await updateAdminUserRoleAction(user.id, role);
    setPending(false);
    if (res.ok) {
      toast.success("Role updated.");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <select
      value={user.role}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as AdminRole)}
      className="input-field !py-1.5 !text-xs w-auto"
    >
      {ADMIN_ROLES.map((role) => (
        <option key={role} value={role}>
          {ADMIN_ROLE_LABEL[role]}
        </option>
      ))}
    </select>
  );
}

function RemoveButton({ user }: { user: AdminUser }) {
  return (
    <DeleteButton
      title={`Remove ${user.email} from admin access?`}
      description="They'll immediately lose access to the admin dashboard."
      confirmLabel="Remove"
      successMessage="Admin user removed."
      action={() => removeAdminUserAction(user.id)}
      iconOnly
      ariaLabel={`Remove ${user.email}`}
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-ink/40 hover:bg-danger/10 hover:text-danger transition disabled:opacity-60"
    />
  );
}

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  if (users.length === 0) {
    return (
      <div className="ornate-card p-10 text-center">
        <p className="text-sm text-ink/60">
          No admin users added yet. Use the form to grant someone a role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="ornate-card p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm font-medium text-ink">{user.email}</p>
            <p className="text-xs text-ink/50 mt-0.5">
              {ADMIN_ROLE_DESCRIPTION[user.role]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RoleSelect user={user} />
            <RemoveButton user={user} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BootstrapOwnersNotice({ emails }: { emails: string[] }) {
  if (emails.length === 0) return null;
  return (
    <div className="ornate-card p-4 flex items-start gap-3 bg-emerald-deep/5">
      <ShieldCheck className="h-4 w-4 text-emerald-deep mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-emerald-deep">Standing Owner access (ADMIN_EMAILS)</p>
        <p className="text-xs text-ink/60 mt-1">
          These emails always have full Owner access via the environment variable, independent of
          this list. This is the account-recovery path — it can&apos;t be changed here.
        </p>
        <ul className="text-xs text-ink/70 mt-2 space-y-0.5">
          {emails.map((email) => (
            <li key={email}>{email}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
