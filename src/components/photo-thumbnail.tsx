"use client";

import { useEffect, useRef, useState } from "react";
import { createLimiter } from "@/lib/concurrency";
import { cn } from "@/lib/utils";
import type { ScannedImage } from "@/lib/drive/scan";

// Shared across every thumbnail on the page so we never have more than a
// handful of Drive downloads in flight at once, regardless of how many
// thumbnails have scrolled into view.
const limitFetch = createLimiter(10);

/**
 * thumbnailLink (lh3.googleusercontent.com) doesn't support CORS for
 * Authorization-header fetches, and is a short-lived signed URL that can go
 * stale - so fetch via our own proxy route (server-side, refreshes a stale
 * link automatically) and render as a blob URL. Only starts downloading
 * once the thumbnail scrolls near the viewport.
 */
export function PhotoThumbnail({ image }: { image: ScannedImage }) {
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

    const params = new URLSearchParams({ fileId: image.id });
    if (image.thumbnailLink) params.set("url", image.thumbnailLink);

    limitFetch(() =>
      fetch(`/api/drive/thumbnail?${params.toString()}`).then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.blob();
      }),
    )
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
  }, [visible, image.id, image.thumbnailLink]);

  return (
    <figure
      ref={elementRef}
      className="flex flex-col gap-1 overflow-hidden rounded-lg ring-1 ring-foreground/10"
      title={`${image.path}/${image.name}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={image.name}
          className="aspect-square w-full bg-zinc-100 object-cover transition-transform duration-200 group-hover:scale-105 dark:bg-zinc-900"
        />
      ) : (
        <div
          className={cn(
            "flex aspect-square w-full items-center justify-center bg-muted p-2 text-center text-xs text-muted-foreground",
            visible && !failed && "animate-pulse",
          )}
        >
          {failed ? image.name : ""}
        </div>
      )}
    </figure>
  );
}

