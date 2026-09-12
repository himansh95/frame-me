import { create } from "zustand";
import type { MatchResult, MatchProgress } from "@/lib/face/match";

export type MatchStatus = "idle" | "running" | "done" | "error";

interface MatchState {
  status: MatchStatus;
  progress: MatchProgress;
  results: MatchResult[];
  error: string | null;
  start: () => void;
  setProgress: (progress: MatchProgress) => void;
  finish: (results: MatchResult[]) => void;
  fail: (error: string) => void;
  reset: () => void;
}

const initialProgress: MatchProgress = { processed: 0, total: 0, matched: 0 };

export const useMatchStore = create<MatchState>((set) => ({
  status: "idle",
  progress: initialProgress,
  results: [],
  error: null,
  start: () =>
    set({ status: "running", progress: initialProgress, results: [], error: null }),
  setProgress: (progress) => set({ progress }),
  finish: (results) => set({ status: "done", results }),
  fail: (error) => set({ status: "error", error }),
  reset: () => set({ status: "idle", progress: initialProgress, results: [], error: null }),
}));
