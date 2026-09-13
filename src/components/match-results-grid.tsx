"use client";

import { useMemo, useState } from "react";
import { PhotoThumbnail } from "@/components/photo-thumbnail";
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
    <div className="flex w-full max-w-5xl flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        {keptCount} of {candidates.length} candidates kept - click a photo to
        toggle it if it isn&apos;t you.
      </p>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {candidates.map((r) => {
          const isRejected = rejected.has(r.image.id);
          return (
            <button
              key={r.image.id}
              type="button"
              onClick={() => toggle(r.image.id)}
              className={`relative text-left ${isRejected ? "opacity-40" : ""}`}
            >
              <PhotoThumbnail image={r.image} />
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                {r.distance?.toFixed(3)}
              </span>
              <span className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                {isRejected ? "Not me" : "Keep"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
