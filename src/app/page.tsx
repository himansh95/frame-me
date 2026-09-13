"use client";

import { useSession } from "next-auth/react";
import { FaceMatchRunner } from "@/components/face-match-runner";
import { FolderPicker } from "@/components/folder-picker";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { PhotoGrid } from "@/components/photo-grid";
import { SelfieUpload } from "@/components/selfie-upload";
import { StepCard } from "@/components/step-card";
import { useScanStore } from "@/stores/scan-store";
import { useSelfieStore } from "@/stores/selfie-store";

export default function Home() {
  const { data: session, status } = useSession();
  const images = useScanStore((s) => s.images);
  const selfieStatus = useSelfieStore((s) => s.status);
  const scanStatus = useScanStore((s) => s.status);

  return (
    <div className="flex flex-1 justify-center bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_60%)] px-6 py-12">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text font-heading text-4xl font-bold text-transparent">
            Frame Me
          </h1>
          <p className="max-w-md text-muted-foreground">
            Find yourself in a shared event album in seconds - upload a
            selfie, point to the folder, and let your browser do the rest.
          </p>
        </div>

        {status === "authenticated" ? (
          <div className="flex w-full flex-col gap-5">
            <StepCard
              step={1}
              title="Add your selfie"
              description="A clear, front-facing photo works best."
              done={selfieStatus === "done"}
            >
              <SelfieUpload />
            </StepCard>

            <StepCard
              step={2}
              title="Point to the album"
              description="Paste the shared Google Drive folder link."
              done={scanStatus === "done"}
            >
              <FolderPicker />
            </StepCard>

            <StepCard step={3} title="Find your photos">
              <FaceMatchRunner />
            </StepCard>

            {images.length > 0 && (
              <details className="w-full rounded-xl ring-1 ring-foreground/10">
                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-muted-foreground">
                  All {images.length} photos found in the album
                </summary>
                <div className="px-4 pb-4">
                  <PhotoGrid images={images} />
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-4">
            <GoogleSignInButton size="lg" />
            <p className="text-xs text-muted-foreground">
              We only use your Google sign-in to read the photo album you
              point us to.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

