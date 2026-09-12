import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Only allow proxying Google's own thumbnail CDN to avoid this becoming an
// open image/SSRF proxy.
const ALLOWED_HOST_SUFFIX = ".googleusercontent.com";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thumbnailUrl = req.nextUrl.searchParams.get("url");
  if (!thumbnailUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(thumbnailUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
    return NextResponse.json({ error: "Disallowed host" }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString(), {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Upstream error (${upstream.status})` },
      { status: 502 },
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
