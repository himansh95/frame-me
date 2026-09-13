"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PhotoThumbnail } from "@/components/photo-thumbnail";
import type { ScannedImage } from "@/lib/drive/scan";

const PAGE_SIZE = 60;

export function PhotoGrid({ images }: { images: ScannedImage[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (images.length === 0) return null;

  const visible = images.slice(0, visibleCount);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {visible.map((image) => (
          <div key={image.id} className="group">
            <PhotoThumbnail image={image} />
          </div>
        ))}
      </div>
      {visibleCount < images.length && (
        <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
          Load more ({images.length - visibleCount} remaining)
        </Button>
      )}
    </div>
  );
}

