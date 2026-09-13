/**
 * Drive's thumbnailLink URLs (lh3.googleusercontent.com) end with a
 * resizable "=sNNN" size parameter - bump it up for a better-quality (but
 * still much smaller than the original) image, e.g. for face detection.
 */
export function resizeThumbnailUrl(url: string, size: number): string {
  if (/=s\d+$/.test(url)) {
    return url.replace(/=s\d+$/, `=s${size}`);
  }
  return `${url}=s${size}`;
}
