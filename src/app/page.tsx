"use client";

import { useSession } from "next-auth/react";
import { FolderPicker } from "@/components/folder-picker";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex flex-1 items-center justify-center">
      <main className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">Frame Me</h1>
        {status === "authenticated" ? (
          <FolderPicker />
        ) : (
          <p className="text-muted-foreground">
            Sign in with Google to get started.
          </p>
        )}
      </main>
    </div>

  );
}

