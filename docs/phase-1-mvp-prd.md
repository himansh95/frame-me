# Phase 1 (MVP) — Implementation PRD

Reference: [docs/plan.md](./plan.md) for overall architecture/tech stack.
This document breaks Use Case 1 (filter a shared Google Drive event album by
face / bib number) into small, sequential, shippable steps. Follow in order —
each step should be independently testable before moving to the next.

## Scope

**In scope:** Google login, pasting a shared Drive folder link, recursive
subfolder scan, selfie-based face matching, bib-number OCR matching, review
grid, export via ZIP download or copy-to-Drive.

**Out of scope (Phase 2+):** photo quality scoring, best-of album picking,
cross-device saved history, smarter bib-region detection.

---

## Step 1 — Project scaffolding

**Goal:** Empty but deployable app.

- Initialize Next.js (App Router) + TypeScript project.
- Add Tailwind CSS + shadcn/ui.
- Set up repo structure per [docs/plan.md](./plan.md) section 9.
- Push to GitHub, connect repo to Vercel, confirm a blank deploy works.

**Done when:** visiting the Vercel URL shows a placeholder home page.

---

## Step 2 — Google OAuth login

**Goal:** User can sign in with Google and we hold a Drive-scoped access token.

- Create a Google Cloud project + OAuth consent screen (Testing mode, add
  yourself as a test user).
- Request scopes: `drive.readonly` and `drive.file`.
- Wire up Auth.js (NextAuth) with the Google provider.
- Store the access token in the session (client-side accessible, since Drive
  calls happen in the browser).
- Add a simple "Sign in with Google" button + signed-in state in the header.

**Done when:** a logged-in user's Drive access token can be read in a client
component (log it to console to confirm), and sign-out works.

---

## Step 3 — Folder link input & ID parsing

**Goal:** User pastes a Drive folder share link and we extract a usable
folder ID.

- Build a form/input for pasting a Google Drive folder URL.
- Parse the folder ID out of common URL formats
  (`drive.google.com/drive/folders/<id>`, `?id=<id>`, etc.).
- Validate access by calling `files.get` on that ID; show a clear error if
  it's not a folder or not accessible to the signed-in user.

**Done when:** pasting a real shared folder link shows its name confirmed
on screen ("Found folder: Race Day 2026").

---

## Step 4 — Recursive folder scan

**Goal:** Walk the full folder tree and list every image file, however deep.

- Implement the BFS folder walker described in
  [docs/plan.md](./plan.md#5-use-case-1-flow-mvp-filter-by-face--bib-number):
  queue-based traversal, `files.list` with `pageToken` pagination, push
  subfolders back onto the queue, collect `image/*` mimeTypes.
- Cap concurrency (e.g. 3–5 concurrent `files.list` calls).
- Cache visited folder results in IndexedDB keyed by folder ID (skip re-walk
  on resume within the same folder tree).
- Show a live progress indicator: folders scanned, photos found so far.

**Done when:** a folder with nested subfolders returns a complete, correct
flat list of image file IDs/names/thumbnail links, with progress visible.

---

## Step 5 — Photo grid sanity view

**Goal:** Visually confirm the scan worked before adding ML on top.

- Render a responsive grid of thumbnails (use Drive's `thumbnailLink`, no
  need to download full images yet).
- Paginate/virtualize the grid for large sets (100s–1000s of photos).

**Done when:** all scanned photos are browsable in a grid, including ones
from subfolders.

---

## Step 6 — Selfie upload & face descriptor

**Goal:** Turn a user-provided selfie into a reference face descriptor.

- Add `face-api.js`, self-host model weights under `public/models`.
- Build selfie capture/upload UI (webcam or file upload).
- Run face detection + descriptor extraction on the selfie in a Web Worker.
- Handle "no face found" / "multiple faces found" cases with a re-try prompt.

**Done when:** uploading a clear selfie produces a stored 128-d descriptor in
app state, with friendly errors on bad input.

---

## Step 7 — Face matching pipeline

**Goal:** Score every scanned photo against the selfie descriptor.

- Build a Web Worker pool that, per photo: downloads the image blob from
  Drive, runs face detection + descriptors, computes Euclidean distance to
  the reference descriptor.
- Cache per-file results in IndexedDB (`fileId -> {distance, matched}`) so
  reprocessing is skipped on resume.
- Add a concurrency limit + progress bar ("processed 240/900").
- Pick and document a distance threshold for "match" (make it a tunable
  constant for now).

**Done when:** running this over a real event folder returns a reasonable
set of matched photos with confidence scores, within a few minutes for
~500–1000 photos.

---

## Step 8 — Bib number OCR matching

**Goal:** Alternate/complementary matching path for races.

- Add `Tesseract.js` in a separate Web Worker.
- Add a "bib number" text input.
- Run OCR per photo (reuse downloaded blobs from Step 7 where possible),
  regex-match digit sequences against the entered bib number.
- Cache OCR results in IndexedDB the same way as face results.
- Allow the user to enable face matching, bib matching, or both (OR'd
  together).

**Done when:** entering a real bib number surfaces the correct photos from a
race folder, cached so re-runs are instant.

---

## Step 9 — Review & results grid

**Goal:** Let the user confirm/curate matches before export.

- Grid of matched photos with match source (face/bib) and confidence shown.
- Manual toggle to include/exclude any photo (fix false positives/negatives).
- "Select all" / result count summary.

**Done when:** user can visually confirm and adjust the final selection set.

---

## Step 10 — Export: ZIP download

**Goal:** Simplest export path, no extra Drive scope needed beyond read.

- On export, fetch full-resolution blobs for the selected photos (parallel,
  capped concurrency) and bundle with `JSZip`.
- Stream the download so memory usage stays reasonable for large selections.

**Done when:** clicking "Download ZIP" produces a correct ZIP of exactly the
selected photos.

---

## Step 11 — Export: copy to a new Drive folder

**Goal:** Alternative export that keeps everything inside the user's own
Drive.

- Use `drive.file` scope to create a `Frame Me - Filtered` folder in the
  user's Drive (My Drive, not the source folder, since we don't own that).
- Use `files.copy` for each selected file into the new folder.
- Handle partial failures gracefully (retry / report which files failed).

**Done when:** clicking "Copy to my Drive" results in a real folder in the
user's Drive containing exactly the selected photos.

---

## Step 12 — Polish & end-to-end QA

**Goal:** Make it robust enough for a real event.

- Handle Drive API rate-limit errors (backoff + retry).
- Handle expired/refreshed OAuth tokens mid-session.
- Add empty/error states (no matches found, folder inaccessible, no faces
  detected in selfie, etc.).
- Run a full end-to-end test against a real shared folder (ideally 500+
  photos across subfolders) for both face and bib matching.

**Done when:** a non-technical friend can go from "paste link" to "download
my photos" without help, on a real event folder.
