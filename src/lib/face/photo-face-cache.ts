import { get, set } from "idb-keyval";

const CACHE_KEY_PREFIX = "frame-me:photo-faces:";

/** Face descriptors previously detected in a Drive photo, keyed by file ID -
 * independent of which selfie is being matched against. */
export async function getCachedPhotoFaces(
  fileId: string,
): Promise<Float32Array[] | undefined> {
  return get<Float32Array[]>(CACHE_KEY_PREFIX + fileId);
}

export async function setCachedPhotoFaces(
  fileId: string,
  descriptors: Float32Array[],
): Promise<void> {
  await set(CACHE_KEY_PREFIX + fileId, descriptors);
}
