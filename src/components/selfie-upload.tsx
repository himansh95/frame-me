"use client";

import { useRef, useState } from "react";
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

      {status === "idle" && !decoding && (
        <Button onClick={() => inputRef.current?.click()}>
          Upload a selfie
        </Button>
      )}
      {decoding && (
        <p className="text-sm text-muted-foreground">Loading photo...</p>
      )}
      {status === "loading" && !decoding && (
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
