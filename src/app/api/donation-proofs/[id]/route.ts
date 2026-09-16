import { NextResponse } from "next/server";
import { isAuthenticated } from "@/app/admin/actions";
import { getStoredProof } from "@/lib/donation-upload";

/**
 * Serves donation proof-of-transfer files. Unlike session posters, these can
 * contain personal bank-transfer receipts, so this route is admin-only —
 * gated the same way every other admin action in the portal is.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 403 });
  }

  const { id } = await params;
  if (!/^[\w-]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid proof id." }, { status: 400 });
  }

  const proof = await getStoredProof(id);
  if (!proof) {
    return NextResponse.json({ error: "Proof not found." }, { status: 404 });
  }

  const bytes = Buffer.from(proof.data, "base64");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": proof.contentType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
    },
  });
}
