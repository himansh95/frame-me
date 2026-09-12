import { loadFaceModels } from "./models";

export class FaceDetectionError extends Error {
  constructor(public readonly reason: "no-face" | "multiple-faces") {
    super(
      reason === "no-face"
        ? "No face found in that photo. Try a clearer, front-facing photo."
        : "Found more than one face. Use a photo with just your face in it.",
    );
    this.name = "FaceDetectionError";
  }
}

/** Detects the single face in an image and returns its 128-d descriptor. */
export async function getFaceDescriptor(
  image: HTMLImageElement,
): Promise<Float32Array> {
  await loadFaceModels();
  const faceapi = await import("face-api.js");

  const detections = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) throw new FaceDetectionError("no-face");
  if (detections.length > 1) throw new FaceDetectionError("multiple-faces");

  return detections[0].descriptor;
}
