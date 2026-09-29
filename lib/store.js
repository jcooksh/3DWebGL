import { create } from 'zustand';

/**
 * Raw scroll input — the ONLY thing this store owns. Every per-frame derived
 * scalar (eased distance, velocity, camera/runner positions) lives in
 * lib/motion.js and is written once per frame by <Motion/>. Read progress
 * imperatively with `useProgress.getState()` inside frame/rAF loops so updates
 * never trigger React re-renders.
 */
export const useProgress = create((set) => ({
  progress: 0,
  setProgress: (p) => set({ progress: p }),
}));
