"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useSelfieStore } from "@/stores/selfie-store";
import { getFaceDescriptor, FaceDetectionError } from "@/lib/face/descriptor";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image file."));
    img.src = url;
  });
}

export function SelfieUpload() {
  const { status, previewUrl, error, start, succeed, fail, reset } =
    useSelfieStore();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    const url = URL.createObjectURL(file);
    start(url);
    try {
      const image = await loadImage(url);
      const descriptor = await getFaceDescriptor(image);
      succeed(descriptor);
    } catch (err) {
      fail(
        err instanceof FaceDetectionError
          ? err.message
          : "Couldn't analyze that photo. Please try another.",
      );
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Your selfie"
          className="size-32 rounded-full border object-cover"
        />
      )}

      {status === "idle" && (
        <Button onClick={() => inputRef.current?.click()}>
          Upload a selfie
        </Button>
      )}
      {status === "loading" && (
        <p className="text-sm text-muted-foreground">Analyzing selfie...</p>
      )}
      {status === "done" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">Face detected ✓</p>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Use a different photo
          </Button>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center gap-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            variant="outline"
            onClick={() => {
              reset();
              inputRef.current?.click();
            }}
          >
            Try another photo
          </Button>
        </div>
      )}
    </div>
  );
}
