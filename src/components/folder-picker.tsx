"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseDriveFolderId } from "@/lib/drive/folder-url";
import { getDriveFolder, DriveApiError, type DriveFile } from "@/lib/drive/api";

export function FolderPicker() {
  const { data: session } = useSession();
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState<DriveFile | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken) return;

    const folderId = parseDriveFolderId(link);
    if (!folderId) {
      setStatus("error");
      setError("Couldn't find a folder ID in that link.");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const found = await getDriveFolder(session.accessToken, folderId);
      setFolder(found);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof DriveApiError ? err.message : "Something went wrong.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste the shared Google Drive folder link"
        />
        <Button type="submit" disabled={status === "loading" || !link}>
          {status === "loading" ? "Checking..." : "Find folder"}
        </Button>
      </div>
      {status === "error" && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {status === "success" && folder && (
        <p className="text-sm text-muted-foreground">
          Found folder: <span className="font-medium">{folder.name}</span>
        </p>
      )}
    </form>
  );
}
