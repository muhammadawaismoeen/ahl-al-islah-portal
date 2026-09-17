"use server";

import { auth, signIn, signOut } from "@/lib/auth";

/** Comma-separated Google emails allowed into /admin — e.g.
 *  "you@gmail.com,colleague@gmail.com". Set in .env.local and Vercel. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function adminSignIn() {
  await signIn("google", { redirectTo: "/admin" });
}

export async function logout() {
  await signOut({ redirectTo: "/admin" });
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return false;
  return adminEmails().includes(email);
}
