import { getDriveFileMedia } from "@/lib/drive/api";
import type { ScannedImage } from "@/lib/drive/scan";
import { loadFaceModels } from "./models";
import { getCachedPhotoFaces, setCachedPhotoFaces } from "./photo-face-cache";

// face-api.js's own recommended threshold for "same person" on its
// faceRecognitionNet descriptors (Euclidean distance). Tunable.
export const DEFAULT_MATCH_THRESHOLD = 0.6;

export interface MatchResult {
  image: ScannedImage;
  /** Smallest distance to the reference descriptor, or null if this photo
   * has no detectable faces at all. */
  distance: number | null;
  matched: boolean;
}

export interface MatchProgress {
  processed: number;
  total: number;
  matched: number;
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function decodeToAnalysisCanvas(
  blob: Blob,
  maxDimension = 1024,
): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    bitmap.close();
  }
}

async function getPhotoFaceDescriptors(
  accessToken: string,
  image: ScannedImage,
): Promise<Float32Array[]> {
  const cached = await getCachedPhotoFaces(image.id);
  if (cached) return cached;

  const faceapi = await import("face-api.js");
  const blob = await getDriveFileMedia(accessToken, image.id);
  const canvas = await decodeToAnalysisCanvas(blob);

  const detections = await faceapi
    .detectAllFaces(
      canvas,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.3 }),
    )
    .withFaceLandmarks()
    .withFaceDescriptors();

  const descriptors = detections.map((d) => d.descriptor);
  await setCachedPhotoFaces(image.id, descriptors);
  return descriptors;
}

/**
 * Scores every photo against a reference (selfie) face descriptor.
 * Concurrency-capped, with a macrotask yield between photos so the
 * progress UI stays responsive (see /memories/react-paint-before-heavy-work.md).
 */
export async function matchPhotosToDescriptor(
  images: ScannedImage[],
  referenceDescriptor: Float32Array,
  accessToken: string,
  options: {
    threshold?: number;
    concurrency?: number;
    onProgress?: (progress: MatchProgress) => void;
  } = {},
): Promise<MatchResult[]> {
  await loadFaceModels();
  const faceapi = await import("face-api.js");
  const threshold = options.threshold ?? DEFAULT_MATCH_THRESHOLD;
  const concurrency = options.concurrency ?? 4;

  return new Promise((resolve) => {
    const results: MatchResult[] = new Array(images.length);
    let processed = 0;
    let matched = 0;
    let nextIndex = 0;
    let active = 0;

    function reportProgress() {
      options.onProgress?.({ processed, total: images.length, matched });
    }

    function schedule() {
      while (active < concurrency && nextIndex < images.length) {
        const i = nextIndex++;
        active++;
        processOne(i);
      }
      if (processed === images.length && active === 0) {
        resolve(results);
      }
    }

    async function processOne(i: number) {
      const image = images[i];
      try {
        const descriptors = await getPhotoFaceDescriptors(accessToken, image);
        let best: number | null = null;
        for (const descriptor of descriptors) {
          const dist = faceapi.euclideanDistance(referenceDescriptor, descriptor);
          if (best === null || dist < best) best = dist;
        }
        const isMatch = best !== null && best <= threshold;
        results[i] = { image, distance: best, matched: isMatch };
        if (isMatch) matched++;
      } catch {
        results[i] = { image, distance: null, matched: false };
      } finally {
        processed++;
        active--;
        reportProgress();
        await yieldToBrowser();
        schedule();
      }
    }

    schedule();
  });
}
