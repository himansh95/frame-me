"use client";

import { useSession } from "next-auth/react";
import { FolderPicker } from "@/components/folder-picker";
import { PhotoGrid } from "@/components/photo-grid";
import { useScanStore } from "@/stores/scan-store";

export default function Home() {
  const { data: session, status } = useSession();
  const images = useScanStore((s) => s.images);

  return (
    <div className="flex flex-1 justify-center bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_60%)] px-6 py-10">
      <main className="flex w-full max-w-5xl flex-col items-center gap-6 text-center">
        <h1 className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-3xl font-bold text-transparent">
          Frame Me
        </h1>
        {status === "authenticated" ? (
          <>
            <FolderPicker />
            <PhotoGrid images={images} />
          </>
        ) : (
          <p className="text-muted-foreground">
            Sign in with Google to get started.
          </p>
        )}
      </main>
    </div>


  );
}

