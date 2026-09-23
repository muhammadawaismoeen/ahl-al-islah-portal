"use server";

import { auth, signIn, signOut } from "@/lib/auth";
import { getAdminUserByEmail } from "@/lib/admin-users-store";
import { getFeatureTier } from "@/lib/admin-permissions";
import type { AdminRole, AdminFeature, PermissionTier } from "@/lib/admin-types";

/** Comma-separated Google emails allowed into /admin — e.g.
 *  "you@gmail.com,colleague@gmail.com". Set in .env.local and Vercel.
 *  Always treated as full-access Owners: the account-recovery path if the
 *  admin-users store is ever empty or misconfigured, independent of it. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Exposed read-only for the Users & Roles screen, so Owners can see who the
 *  env-var bootstrap path covers without editing it from the UI. */
export async function bootstrapOwnerEmails(): Promise<string[]> {
  return adminEmails();
}

export async function adminSignIn() {
  await signIn("google", { redirectTo: "/admin" });
}

export async function logout() {
  await signOut({ redirectTo: "/admin" });
}

export async function currentAdminEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email?.toLowerCase() ?? null;
}

/** Resolves the signed-in admin's role plus any per-feature permission
 *  overrides in one lookup, so callers needing a specific feature's tier
 *  (getFeaturePermission below) don't each re-read the store. */
async function getCurrentAdminContext(): Promise<{
  role: AdminRole | null;
  overrides: Partial<Record<AdminFeature, PermissionTier>>;
}> {
  const email = await currentAdminEmail();
  if (!email) return { role: null, overrides: {} };
  if (adminEmails().includes(email)) return { role: "owner", overrides: {} };
  const user = await getAdminUserByEmail(email);
  return { role: user?.role ?? null, overrides: user?.permissionOverrides ?? {} };
}

export async function getAdminRole(): Promise<AdminRole | null> {
  return (await getCurrentAdminContext()).role;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAdminRole()) !== null;
}

/** What the signed-in admin can do on one specific screen — see
 *  getFeatureTier in admin-permissions.ts for how role + overrides resolve
 *  into a tier. Use this (not getAdminRole alone) whenever a page or action
 *  needs to know Read-Only vs Can Edit vs Can Edit + Delete. */
export async function getFeaturePermission(feature: AdminFeature): Promise<PermissionTier> {
  const { role, overrides } = await getCurrentAdminContext();
  if (!role) return "none";
  return getFeatureTier(role, overrides, feature);
}
