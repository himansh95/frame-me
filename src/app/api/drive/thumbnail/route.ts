import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resizeThumbnailUrl } from "@/lib/drive/thumbnail-url";

// Only allow proxying Google's own thumbnail CDN to avoid this becoming an
// open image/SSRF proxy.
const ALLOWED_HOST_SUFFIX = ".googleusercontent.com";

function isAllowedThumbnailHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(ALLOWED_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** thumbnailLink is a short-lived signed URL - re-fetch a fresh one via the
 * Drive API when a cached one has gone stale. */
async function fetchFreshThumbnailLink(
  fileId: string,
  accessToken: string,
): Promise<string | null> {
  const metaUrl = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
  metaUrl.searchParams.set("fields", "thumbnailLink");
  metaUrl.searchParams.set("supportsAllDrives", "true");

  const res = await fetch(metaUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const data: { thumbnailLink?: string } = await res.json();
  return data.thumbnailLink ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fileId = req.nextUrl.searchParams.get("fileId");
  const cachedUrl = req.nextUrl.searchParams.get("url");
  const size = req.nextUrl.searchParams.get("size");

  if (!fileId && !cachedUrl) {
    return NextResponse.json({ error: "Missing fileId or url" }, { status: 400 });
  }
  if (cachedUrl && !isAllowedThumbnailHost(cachedUrl)) {
    return NextResponse.json({ error: "Disallowed host" }, { status: 400 });
  }

  const accessToken = session.accessToken;
  function tryUrl(rawUrl: string) {
    const target = size ? resizeThumbnailUrl(rawUrl, Number(size)) : rawUrl;
    return fetch(target, { headers: { Authorization: `Bearer ${accessToken}` } });
  }

  let upstream = cachedUrl ? await tryUrl(cachedUrl) : undefined;

  // Cached link missing/stale (403/404 etc.) - fetch a fresh one and retry once.
  if ((!upstream || !upstream.ok) && fileId) {
    const fresh = await fetchFreshThumbnailLink(fileId, accessToken);
    if (fresh && isAllowedThumbnailHost(fresh)) {
      upstream = await tryUrl(fresh);
    }
  }

  if (!upstream || !upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Upstream error (${upstream?.status ?? "unavailable"})` },
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
