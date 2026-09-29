'use client';
import { useFrame } from '@react-three/fiber';
import { useProgress } from '@/lib/store';
import { updateMotion } from '@/lib/motion';

/**
 * The motion step. Mounted as the FIRST child of <Canvas> so its useFrame
 * subscription runs before every other system's; it is the only writer of the
 * shared motion state (lib/motion.js). Everything downstream reads fresh
 * same-frame values.
 */
export default function Motion() {
  useFrame((_, delta) => {
    updateMotion(useProgress.getState().progress, delta);
  });
  return null;
}
