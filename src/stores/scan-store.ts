import { create } from "zustand";
import type { ScannedImage, ScanProgress } from "@/lib/drive/scan";

export type ScanStatus = "idle" | "scanning" | "done" | "error";

interface ScanState {
  status: ScanStatus;
  progress: ScanProgress;
  images: ScannedImage[];
  error: string | null;
  start: () => void;
  setProgress: (progress: ScanProgress) => void;
  finish: (images: ScannedImage[]) => void;
  fail: (error: string) => void;
  reset: () => void;
}

const initialProgress: ScanProgress = {
  foldersScanned: 0,
  foldersQueued: 0,
  photosFound: 0,
};

export const useScanStore = create<ScanState>((set) => ({
  status: "idle",
  progress: initialProgress,
  images: [],
  error: null,
  start: () =>
    set({ status: "scanning", progress: initialProgress, images: [], error: null }),
  setProgress: (progress) => set({ progress }),
  finish: (images) => set({ status: "done", images }),
  fail: (error) => set({ status: "error", error }),
  reset: () => set({ status: "idle", progress: initialProgress, images: [], error: null }),
}));
