/**
 * Extract a Google Drive file/folder ID from a share link, or pass through
 * if the input already looks like a bare ID.
 */
export function parseDriveFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // https://drive.google.com/drive/folders/<id>[/...][?...]
  // https://drive.google.com/drive/u/0/folders/<id>[/...][?...]
  const foldersMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (foldersMatch) return foldersMatch[1];

  // https://drive.google.com/open?id=<id>
  // https://drive.google.com/drive/folders/<id>?id=<id> (id query param variants)
  try {
    const url = new URL(trimmed);
    const idParam = url.searchParams.get("id");
    if (idParam) return idParam;
  } catch {
    // Not a valid URL - fall through to bare-ID handling below.
  }

  // Bare ID pasted directly (Drive IDs are alphanumeric plus - and _).
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;

  return null;
}
