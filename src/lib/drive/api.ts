const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export class DriveApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "DriveApiError";
  }
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

/** Fetches basic metadata for a Drive file/folder by ID. */
export async function getDriveFile(
  accessToken: string,
  fileId: string,
): Promise<DriveFile> {
  const url = new URL(`${DRIVE_FILES_ENDPOINT}/${fileId}`);
  url.searchParams.set("fields", "id,name,mimeType");
  url.searchParams.set("supportsAllDrives", "true");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new DriveApiError(
        "Folder not found. Check the link and make sure you have access to it.",
        404,
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new DriveApiError(
        "Access denied. Sign in again or confirm you have access to this folder.",
        res.status,
      );
    }
    throw new DriveApiError(`Drive API error (${res.status})`, res.status);
  }

  return res.json();
}

/** Fetches a Drive file/folder and validates it is actually a folder. */
export async function getDriveFolder(
  accessToken: string,
  folderId: string,
): Promise<DriveFile> {
  const file = await getDriveFile(accessToken, folderId);
  if (file.mimeType !== FOLDER_MIME_TYPE) {
    throw new DriveApiError(`"${file.name}" is not a folder.`, 400);
  }
  return file;
}
