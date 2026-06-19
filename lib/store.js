import { create } from 'zustand';

// Single source of truth: `progress` is 0..1 normalized scroll distance.
// Everything — camera, runner, HUD stopwatch, distance counter, quote reveals —
// reads from this one scalar. Read it imperatively with `useProgress.getState()`
// inside frame/rAF loops so per-frame updates never trigger React re-renders.
export const useProgress = create((set) => ({
  progress: 0,
  setProgress: (p) => set({ progress: p }),
}));
