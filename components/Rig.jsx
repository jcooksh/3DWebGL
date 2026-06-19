'use client';
import { useFrame } from '@react-three/fiber';
import { useProgress } from '@/lib/store';
import { trackEase } from '@/lib/ease';
import { TRACK_LENGTH } from '@/lib/constants';

/**
 * Camera chases the spark down the corridor. Easing comes from Lenis smoothing +
 * the bespoke CustomEase curve; the camera is then glued a fixed distance behind
 * the spark, with a touch of handheld sway for life.
 */
export default function Rig() {
  useFrame((state) => {
    const d = trackEase(useProgress.getState().progress);
    const sparkZ = -d * TRACK_LENGTH;
    const cam = state.camera;

    cam.position.z = sparkZ + 6;
    cam.position.x = Math.sin(d * 22) * 0.22;
    cam.position.y = 1.9 + Math.sin(d * 52) * 0.05;
    cam.lookAt(0, 1.25, sparkZ - 1);
  });

  return null;
}
