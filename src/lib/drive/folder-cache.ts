import { get, set, clear } from "idb-keyval";
import type { DriveFile } from "./api";

const CACHE_KEY_PREFIX = "frame-me:folder-children:";

interface CachedFolder {
  children: DriveFile[];
  scannedAt: number;
}

export async function getCachedFolderChildren(
  folderId: string,
): Promise<DriveFile[] | undefined> {
  const cached = await get<CachedFolder>(CACHE_KEY_PREFIX + folderId);
  return cached?.children;
}

export async function setCachedFolderChildren(
  folderId: string,
  children: DriveFile[],
): Promise<void> {
  await set(CACHE_KEY_PREFIX + folderId, {
    children,
    scannedAt: Date.now(),
  } satisfies CachedFolder);
}

/** Wipes all cached folder listings (e.g. for a manual "rescan"). */
export async function clearFolderCache(): Promise<void> {
  await clear();
}
