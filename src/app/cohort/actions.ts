"use server";

import { auth, signIn, signOut } from "@/lib/auth";

export type HeadRole =
  | "male"
  | "female"
  | "male-core"
  | "deputy-male"
  | "deputy-female";

/** Reuses the same per-role email env vars the old password login used —
 *  they already are the allow-list, just re-keyed by Google identity now. */
function roleForEmail(email: string): HeadRole | null {
  const normalized = email.toLowerCase();
  const roleEnvPairs: Array<[HeadRole, string | undefined]> = [
    ["male", process.env.HEAD_MALE_EMAIL],
    ["female", process.env.HEAD_FEMALE_EMAIL],
    ["male-core", process.env.HEAD_MALE_CORE_EMAIL],
    ["deputy-male", process.env.HEAD_DEPUTY_MALE_EMAIL],
    ["deputy-female", process.env.HEAD_DEPUTY_FEMALE_EMAIL],
  ];
  for (const [role, roleEmail] of roleEnvPairs) {
    if (roleEmail && roleEmail.trim().toLowerCase() === normalized) {
      return role;
    }
  }
  return null;
}

export async function getHeadRole(): Promise<HeadRole | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  return roleForEmail(email);
}

export async function headSignIn() {
  await signIn("google", { redirectTo: "/cohort" });
}

export async function logoutHead() {
  await signOut({ redirectTo: "/cohort" });
}
