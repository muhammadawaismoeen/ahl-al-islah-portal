import { NextResponse } from "next/server";
import { getStoredPoster } from "@/lib/poster-upload";

/**
 * Serves session poster images stored in Redis. Poster ids are unique per
 * upload (never overwritten), so responses are immutable and long-cacheable.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  if (!/^[\w-]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid poster id." }, { status: 400 });
  }

  const poster = await getStoredPoster(id);
  if (!poster) {
    return NextResponse.json({ error: "Poster not found." }, { status: 404 });
  }

  const bytes = Buffer.from(poster.data, "base64");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": poster.contentType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
