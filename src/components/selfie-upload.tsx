"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelfieStore } from "@/stores/selfie-store";
import { getFaceDescriptor, FaceDetectionError } from "@/lib/face/descriptor";
import { decodePhotoFile } from "@/lib/image-decode";

export function SelfieUpload() {
  const { status, previewUrl, error, start, succeed, fail, reset } =
    useSelfieStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [decoding, setDecoding] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setDecoding(true);
    try {
      // Decode once via createImageBitmap, then derive both a small (fast
      // to render) preview and a modestly-sized canvas for analysis -
      // rather than letting a multi-MP source photo decode twice (once for
      // display, once for detection) and stall the preview for seconds.
      const { previewUrl: url, analysisCanvas } = await decodePhotoFile(file);
      setDecoding(false);
      start(url);
      // Promise microtask chains (awaits) don't force the browser to
      // paint - only an actual macrotask boundary does. Yield here so the
      // preview image renders before face-api's heavy CPU/GPU work starts.
      await new Promise((resolve) => setTimeout(resolve, 0));
      const descriptor = await getFaceDescriptor(analysisCanvas);
      succeed(descriptor);
    } catch (err) {
      setDecoding(false);
      fail(
        err instanceof FaceDetectionError
          ? err.message
          : "Couldn't analyze that photo. Please try another.",
      );
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-primary/60 disabled:pointer-events-none"
        disabled={decoding || status === "loading"}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Your selfie"
            className="size-full object-cover"
          />
        ) : (
          <Camera className="size-7 text-muted-foreground transition-colors group-hover:text-primary" />
        )}
        {(decoding || status === "loading") && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-6 animate-spin text-primary" />
          </span>
        )}
      </button>

      {status === "idle" && !decoding && (
        <p className="text-sm text-muted-foreground">
          Click the circle to upload a selfie
        </p>
      )}
      {decoding && (
        <p className="text-sm text-muted-foreground">Loading photo...</p>
      )}
      {status === "loading" && !decoding && (
        <p className="text-sm text-muted-foreground">Analyzing selfie...</p>
      )}
      {status === "done" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-primary">Face detected ✓</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <RotateCcw className="size-3.5" />
            Use a different photo
          </Button>
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center gap-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              inputRef.current?.click();
            }}
          >
            <RotateCcw className="size-3.5" />
            Try another photo
          </Button>
        </div>
      )}
    </div>
  );
}
