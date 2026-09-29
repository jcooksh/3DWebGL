'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { motion } from '@/lib/motion';

/**
 * Camera presentation. Position/FOV/roll/shake layered on top of the shared
 * motion state — no chase policy lives here anymore (that's lib/motion.js),
 * only how the camera *feels*: sway, speed shake, FOV pull, banking roll.
 */
export default function Rig() {
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const cam = state.camera;
    const v = motion.velocity;
    const d = motion.dist ?? 0;

    cam.position.z = motion.camZ;
    const sway = Math.sin(d * 22) * 0.22;
    cam.position.x = sway;
    cam.position.y = 1.9 + Math.sin(d * 52) * 0.05;

    // speed shake: two incommensurate sin octaves
    const t = state.clock.elapsedTime;
    const shake = v * v * 0.045;
    cam.position.x += Math.sin(t * 31.7) * shake;
    cam.position.y += Math.sin(t * 24.3 + 1.7) * shake * 0.7;

    // FOV pull: 46° at rest → 56° flat out
    const fov = 46 + v * 10;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    lookAt.set(0, 1.25, motion.sparkZ - 1);
    cam.lookAt(lookAt);
    cam.rotation.z += Math.sin(d * 22) * 0.06 + v * 0.02 * Math.sin(t * 17.3);
  });

  return null;
}
