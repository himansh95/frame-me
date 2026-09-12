"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { scanDriveFolderTree } from "@/lib/drive/scan";
import { useScanStore } from "@/stores/scan-store";
import type { DriveFile } from "@/lib/drive/api";

export function FolderScanner({ folder }: { folder: DriveFile }) {
  const { data: session } = useSession();
  const { status, progress, images, error, start, setProgress, finish, fail } =
    useScanStore();

  async function handleScan() {
    if (!session?.accessToken) return;
    start();
    try {
      const found = await scanDriveFolderTree(
        session.accessToken,
        folder.id,
        folder.name,
        { onProgress: setProgress },
      );
      finish(found);
    } catch (err) {
      fail(err instanceof Error ? err.message : "Scan failed.");
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Button onClick={handleScan} disabled={status === "scanning"}>
        {status === "scanning" ? "Scanning..." : "Scan for photos"}
      </Button>
      {status === "scanning" && (
        <p className="text-sm text-muted-foreground">
          Scanned {progress.foldersScanned} subfolder
          {progress.foldersScanned === 1 ? "" : "s"} · found{" "}
          {progress.photosFound} photo{progress.photosFound === 1 ? "" : "s"}
        </p>
      )}
      {status === "done" && (
        <p className="text-sm text-muted-foreground">
          Done — found {images.length} photo{images.length === 1 ? "" : "s"}{" "}
          across {progress.foldersScanned} subfolder
          {progress.foldersScanned === 1 ? "" : "s"}.
        </p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
