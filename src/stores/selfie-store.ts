import { create } from "zustand";

export type SelfieStatus = "idle" | "loading" | "error" | "done";

interface SelfieState {
  status: SelfieStatus;
  previewUrl: string | null;
  descriptor: Float32Array | null;
  error: string | null;
  start: (previewUrl: string) => void;
  succeed: (descriptor: Float32Array) => void;
  fail: (error: string) => void;
  reset: () => void;
}

export const useSelfieStore = create<SelfieState>((set, get) => ({
  status: "idle",
  previewUrl: null,
  descriptor: null,
  error: null,
  start: (previewUrl) => {
    const prev = get().previewUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({ status: "loading", previewUrl, descriptor: null, error: null });
  },
  succeed: (descriptor) => set({ status: "done", descriptor }),
  fail: (error) => set({ status: "error", error }),
  reset: () => {
    const prev = get().previewUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({ status: "idle", previewUrl: null, descriptor: null, error: null });
  },
}));
