import { NextRequest } from "next/server";
import { signIn } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/drive";
  await signIn("google", { redirectTo: callbackUrl });
}
