"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { MatchResultsGrid } from "@/components/match-results-grid";
import { matchPhotosToDescriptor } from "@/lib/face/match";
import { useMatchStore } from "@/stores/match-store";
import { useScanStore } from "@/stores/scan-store";
import { useSelfieStore } from "@/stores/selfie-store";

export function FaceMatchRunner() {
  const { data: session } = useSession();
  const images = useScanStore((s) => s.images);
  const selfieDescriptor = useSelfieStore((s) => s.descriptor);
  const { status, progress, results, error, start, setProgress, finish, fail } =
    useMatchStore();

  const canRun = !!session?.accessToken && !!selfieDescriptor && images.length > 0;
  if (!canRun && status === "idle") return null;

  async function handleRun() {
    if (!session?.accessToken || !selfieDescriptor) return;
    start();
    try {
      const found = await matchPhotosToDescriptor(
        images,
        selfieDescriptor,
        session.accessToken,
        { onProgress: setProgress },
      );
      finish(found);

      // Diagnostic: log the closest distances so the match threshold can be
      // tuned from real numbers instead of guessing.
      const closest = [...found]
        .filter((r) => r.distance !== null)
        .sort((a, b) => a.distance! - b.distance!)
        .slice(0, 20)
        .map((r) => ({ name: r.image.name, distance: r.distance!.toFixed(3), matched: r.matched }));
      console.table(closest);
    } catch (err) {
      fail(err instanceof Error ? err.message : "Matching failed.");
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Button onClick={handleRun} disabled={!canRun || status === "running"}>
        {status === "running" ? "Finding your photos..." : "Find my photos"}
      </Button>
      {status === "running" && (
        <p className="text-sm text-muted-foreground">
          Processed {progress.processed}/{progress.total} · matched{" "}
          {progress.matched}
        </p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {status === "done" && <MatchResultsGrid results={results} />}
    </div>
  );
}
