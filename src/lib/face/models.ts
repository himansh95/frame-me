let loadPromise: Promise<void> | null = null;

/** Lazily loads face-api.js models from /public/models, only once. */
export async function loadFaceModels(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const faceapi = await import("face-api.js");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);
  })();

  return loadPromise;
}
