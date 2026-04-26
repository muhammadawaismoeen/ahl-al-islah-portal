"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "ahl_head_role";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export type HeadRole = "male" | "female";

export async function getHeadRole(): Promise<HeadRole | null> {
  const val = (await cookies()).get(COOKIE)?.value;
  if (val === "male" || val === "female") return val;
  return null;
}

export async function loginHead(
  formData: FormData
): Promise<{ ok: false; error: string } | void> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = ((formData.get("password") as string) ?? "").trim();

  const maleEmail = (process.env.HEAD_MALE_EMAIL ?? "").toLowerCase();
  const malePass = process.env.HEAD_MALE_PASSWORD ?? "";
  const femaleEmail = (process.env.HEAD_FEMALE_EMAIL ?? "").toLowerCase();
  const femalePass = process.env.HEAD_FEMALE_PASSWORD ?? "";

  let role: HeadRole | null = null;

  if (maleEmail && malePass && email === maleEmail && password === malePass) {
    role = "male";
  } else if (
    femaleEmail &&
    femalePass &&
    email === femaleEmail &&
    password === femalePass
  ) {
    role = "female";
  }

  if (!role) {
    return { ok: false, error: "Incorrect email or password." };
  }

  (await cookies()).set(COOKIE, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  redirect("/cohort");
}

export async function logoutHead() {
  (await cookies()).delete(COOKIE);
  redirect("/cohort");
}
