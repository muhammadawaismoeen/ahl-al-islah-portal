"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "ahl_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function login(formData: FormData) {
  const password = (formData.get("password") as string) ?? "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return {
      ok: false,
      error:
        "ADMIN_PASSWORD is not set for this deployment. On Vercel: Settings → Environment Variables → add ADMIN_PASSWORD for Production, then redeploy. (Local dev: set it in .env.local.)",
    };
  }
  if (password !== expected) {
    return { ok: false, error: "Incorrect password." };
  }

  (await cookies()).set(COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/admin");
}

export async function isAuthenticated(): Promise<boolean> {
  const c = (await cookies()).get(COOKIE);
  return c?.value === "authenticated";
}
