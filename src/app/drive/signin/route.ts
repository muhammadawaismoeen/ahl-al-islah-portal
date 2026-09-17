import { NextRequest } from "next/server";
import { signIn } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/drive";
  // "switch=1" forces Google's account chooser — used when a signed-in
  // session's email doesn't match the Ambassador program's college domain.
  const switchAccount = request.nextUrl.searchParams.get("switch") === "1";
  await signIn(
    "google",
    { redirectTo: callbackUrl },
    switchAccount ? { prompt: "select_account" } : undefined
  );
}
