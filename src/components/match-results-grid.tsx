"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { PhotoThumbnail } from "@/components/photo-thumbnail";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/lib/face/match";

/**
 * Face distance alone can't reliably separate true matches from lookalikes
 * on compressed/candid event photos, so candidates are ranked closest-first
 * and the user confirms or rejects each one instead of trusting a threshold.
 */
export function MatchResultsGrid({ results }: { results: MatchResult[] }) {
  const candidates = useMemo(
    () =>
      results
        .filter((r) => r.matched)
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)),
    [results],
  );
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  if (candidates.length === 0) return null;

  const keptCount = candidates.length - rejected.size;

  function toggle(id: string) {
    setRejected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex w-full flex-col gap-3 pt-1">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{keptCount}</span> of{" "}
        {candidates.length} candidates kept - click a photo to toggle it if
        it isn&apos;t you.
      </p>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {candidates.map((r) => {
          const isRejected = rejected.has(r.image.id);
          return (
            <button
              key={r.image.id}
              type="button"
              onClick={() => toggle(r.image.id)}
              className={cn(
                "group relative overflow-hidden rounded-lg text-left ring-1 ring-foreground/10 transition-all hover:ring-primary/60",
                isRejected && "opacity-45",
              )}
            >
              <PhotoThumbnail image={r.image} />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5 text-white">
                <span className="text-[10px] tabular-nums opacity-80">
                  {r.distance?.toFixed(3)}
                </span>
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full",
                    isRejected ? "bg-white/20" : "bg-primary",
                  )}
                >
                  {isRejected ? (
                    <X className="size-3" />
                  ) : (
                    <Check className="size-3" />
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
