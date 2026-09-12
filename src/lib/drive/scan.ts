import { FOLDER_MIME_TYPE, listFolderChildren, type DriveFile } from "./api";
import { getCachedFolderChildren, setCachedFolderChildren } from "./folder-cache";

export interface ScannedImage {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  /** Subfolder path relative to the scanned root, e.g. "Ceremony/Group photos". */
  path: string;
}

export interface ScanProgress {
  foldersScanned: number;
  foldersQueued: number;
  photosFound: number;
}

interface QueueItem {
  id: string;
  path: string;
}

/**
 * Recursively (breadth-first) walks a Drive folder tree, collecting every
 * image file found at any depth. Concurrency-capped, with per-folder
 * IndexedDB caching so repeated scans of the same tree are fast.
 */
export function scanDriveFolderTree(
  accessToken: string,
  rootFolderId: string,
  rootFolderName: string,
  options: {
    concurrency?: number;
    useCache?: boolean;
    onProgress?: (progress: ScanProgress) => void;
  } = {},
): Promise<ScannedImage[]> {
  const concurrency = options.concurrency ?? 4;
  const useCache = options.useCache ?? true;
  const images: ScannedImage[] = [];
  const queue: QueueItem[] = [{ id: rootFolderId, path: rootFolderName }];

  let foldersScanned = 0;
  // Outstanding = folders queued + folders currently being fetched; scan is
  // done only once this reaches zero (all subfolders discovered so far have
  // themselves been processed).
  let outstanding = 1;
  let active = 0;
  let settled = false;

  return new Promise((resolve, reject) => {
    function reportProgress() {
      options.onProgress?.({
        foldersScanned,
        foldersQueued: queue.length,
        photosFound: images.length,
      });
    }

    function schedule() {
      if (settled) return;
      while (active < concurrency && queue.length > 0) {
        const item = queue.shift()!;
        active++;
        processFolder(item);
      }
      if (outstanding === 0 && active === 0) {
        settled = true;
        resolve(images);
      }
    }

    async function processFolder(item: QueueItem) {
      try {
        let children: DriveFile[] | undefined = useCache
          ? await getCachedFolderChildren(item.id)
          : undefined;

        if (!children) {
          children = await listFolderChildren(accessToken, item.id);
          if (useCache) await setCachedFolderChildren(item.id, children);
        }

        for (const child of children) {
          if (child.mimeType === FOLDER_MIME_TYPE) {
            outstanding++;
            queue.push({ id: child.id, path: `${item.path}/${child.name}` });
          } else if (child.mimeType.startsWith("image/")) {
            images.push({
              id: child.id,
              name: child.name,
              mimeType: child.mimeType,
              thumbnailLink: child.thumbnailLink,
              path: item.path,
            });
          }
        }

        foldersScanned++;
        reportProgress();
      } catch (err) {
        if (!settled) {
          settled = true;
          reject(err instanceof Error ? err : new Error(String(err)));
        }
        return;
      } finally {
        active--;
        outstanding--;
        schedule();
      }
    }

    schedule();
  });
}
