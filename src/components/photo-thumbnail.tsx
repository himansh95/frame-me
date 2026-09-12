"use client";

import { useEffect, useRef, useState } from "react";
import { getDriveFileMedia } from "@/lib/drive/api";
import { createLimiter } from "@/lib/concurrency";
import type { ScannedImage } from "@/lib/drive/scan";

// Shared across every thumbnail on the page so we never have more than a
// handful of Drive downloads in flight at once, regardless of how many
// thumbnails have scrolled into view.
const limitFetch = createLimiter(10);

/**
 * thumbnailLink (lh3.googleusercontent.com) doesn't support CORS for
 * Authorization-header fetches, so pull the actual image bytes via the
 * Drive API's media endpoint instead and render as a blob URL. Only starts
 * downloading once the thumbnail scrolls near the viewport.
 */
export function PhotoThumbnail({
  image,
  accessToken,
}: {
  image: ScannedImage;
  accessToken: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    const fetchThumbnail = image.thumbnailLink
      ? () =>
          fetch(
            `/api/drive/thumbnail?url=${encodeURIComponent(image.thumbnailLink!)}`,
          ).then((res) => {
            if (!res.ok) throw new Error(`${res.status}`);
            return res.blob();
          })
      : () => getDriveFileMedia(accessToken, image.id);

    limitFetch(fetchThumbnail)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [visible, image.id, image.thumbnailLink, accessToken]);

  return (
    <figure
      ref={elementRef}
      className="flex flex-col gap-1 overflow-hidden rounded-md border"
      title={`${image.path}/${image.name}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={image.name}
          className="aspect-square w-full bg-zinc-100 object-cover dark:bg-zinc-900"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-zinc-100 p-2 text-center text-xs text-muted-foreground dark:bg-zinc-900">
          {failed ? image.name : visible ? "Loading..." : ""}
        </div>
      )}
    </figure>
  );
}

