function scaledSize(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function drawToCanvas(bitmap: ImageBitmap, maxDimension: number): HTMLCanvasElement {
  const { width, height } = scaledSize(bitmap.width, bitmap.height, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToObjectUrl(canvas: HTMLCanvasElement, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Couldn't create a preview image."));
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      quality,
    );
  });
}

export interface DecodedPhoto {
  previewUrl: string;
  analysisCanvas: HTMLCanvasElement;
}

/**
 * Decodes a (potentially large, multi-MP) photo file once via
 * createImageBitmap, then derives both a small preview (fast to render)
 * and a modestly-sized canvas for analysis - avoiding a second, competing
 * full-resolution decode.
 */
export async function decodePhotoFile(
  file: File,
  { previewSize = 256, analysisSize = 1024 } = {},
): Promise<DecodedPhoto> {
  const bitmap = await createImageBitmap(file);
  try {
    const analysisCanvas = drawToCanvas(bitmap, analysisSize);
    const previewCanvas = drawToCanvas(bitmap, previewSize);
    const previewUrl = await canvasToObjectUrl(previewCanvas);
    return { previewUrl, analysisCanvas };
  } finally {
    bitmap.close();
  }
}
