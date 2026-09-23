"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ShieldCheck, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABEL,
  ADMIN_ROLE_DESCRIPTION,
  SECTION_FEATURES,
  FEATURE_LABEL,
  PERMISSION_TIERS,
  PERMISSION_TIER_LABEL,
  READ_ONLY_FEATURES,
  sectionsForRole,
} from "@/lib/admin-permissions";
import type { AdminRole, AdminUser, AdminFeature, AdminSection, PermissionTier } from "@/lib/admin-types";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  addAdminUserAction,
  updateAdminUserRoleAction,
  updateAdminUserPermissionsAction,
  removeAdminUserAction,
} from "./actions";

const SECTION_LABEL: Record<Exclude<AdminSection, "users">, string> = {
  people: "People",
  community: "Community",
  programming: "Programming",
  drive: "Qur'an & Seerah Drive",
};

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

function FeaturePermissionSelect({
  user,
  feature,
  tier,
}: {
  user: AdminUser;
  feature: AdminFeature;
  tier: PermissionTier;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const readOnlyFeature = READ_ONLY_FEATURES.has(feature);
  const options = readOnlyFeature
    ? PERMISSION_TIERS.filter((t) => t === "none" || t === "read")
    : PERMISSION_TIERS;

  async function handleChange(next: PermissionTier) {
    setPending(true);
    const res = await updateAdminUserPermissionsAction(user.id, {
      ...user.permissionOverrides,
      [feature]: next,
    });
    setPending(false);
    if (res.ok) {
      toast.success(`${FEATURE_LABEL[feature]} updated.`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-ink/70">{FEATURE_LABEL[feature]}</span>
      <select
        value={tier}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as PermissionTier)}
        className="input-field !py-1 !text-xs w-auto"
      >
        {options.map((t) => (
          <option key={t} value={t}>
            {PERMISSION_TIER_LABEL[t]}
          </option>
        ))}
      </select>
    </div>
  );
}

function PermissionsPanel({ user }: { user: AdminUser }) {
  if (user.role === "owner") {
    return (
      <p className="text-xs text-ink/50 py-2">
        Owners have full access to everything — per-feature limits don&apos;t apply.
      </p>
    );
  }

  const sections = sectionsForRole(user.role).filter(
    (s): s is Exclude<AdminSection, "users"> => s !== "users"
  );

  return (
    <div className="space-y-4 pt-1">
      {sections.map((section) => (
        <div key={section}>
          <p className="text-[11px] uppercase tracking-wider text-ink/40 font-medium mb-1">
            {SECTION_LABEL[section]}
          </p>
          <div className="divide-y divide-border/60">
            {SECTION_FEATURES[section].map((feature) => (
              <FeaturePermissionSelect
                key={feature}
                user={user}
                feature={feature}
                tier={user.permissionOverrides?.[feature] ?? "full"}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      {users.map((user) => {
        const expanded = expandedId === user.id;
        return (
          <div key={user.id} className="ornate-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">{user.email}</p>
                <p className="text-xs text-ink/50 mt-0.5">
                  {ADMIN_ROLE_DESCRIPTION[user.role]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : user.id)}
                  className="inline-flex items-center gap-1 text-[11px] text-sapphire hover:underline"
                >
                  <Lock className="h-3 w-3" />
                  Permissions
                  {expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                <RoleSelect user={user} />
                <RemoveButton user={user} />
              </div>
            </div>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-border">
                <PermissionsPanel user={user} />
              </div>
            )}
          </div>
        );
      })}
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
