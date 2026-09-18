"use server";

import { auth, signIn, signOut } from "@/lib/auth";
import { getAdminUserByEmail } from "@/lib/admin-users-store";
import type { AdminRole } from "@/lib/admin-types";

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

export async function getAdminRole(): Promise<AdminRole | null> {
  const email = await currentAdminEmail();
  if (!email) return null;
  if (adminEmails().includes(email)) return "owner";
  const user = await getAdminUserByEmail(email);
  return user?.role ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAdminRole()) !== null;
}
