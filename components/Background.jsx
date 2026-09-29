'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TRACK_LENGTH } from '@/lib/constants';
import { motion } from '@/lib/motion';
import { getGlowTexture } from '@/lib/glowTexture';

/**
 * "Light at the end of the tunnel" — a layered portal (hot core, mid haze,
 * violet ambience). Keyed by DISTANCE: it blazes far away (destination pulling
 * the eye) and dims as you arrive, so the finish frame stays composed instead
 * of washing out. One useFrame writes three opacities; everything else is GPU.
 */
export default function Background() {
  const tex = useMemo(() => getGlowTexture(), []);
  const mats = useRef([]);

  const layers = useMemo(
    () => [
      { z: -TRACK_LENGTH - 10, s: 22, o: 0.85, c: '#ffd9b0' }, // hot core
      { z: -TRACK_LENGTH - 12, s: 52, o: 0.5, c: '#ff7a50' }, // mid haze
      { z: -TRACK_LENGTH - 16, s: 92, o: 0.26, c: '#8a4dc0' }, // violet ambience
    ],
    [],
  );

  useFrame(() => {
    const dist = Math.abs(motion.camZ - (-TRACK_LENGTH - 10));
    // full glow beyond 80 units, gone by ~18 units
    let fade = THREE.MathUtils.clamp((dist - 18) / 62, 0, 1);
    fade = fade * fade * (3 - 2 * fade); // smoothstep
    mats.current.forEach((m, i) => {
      if (m) m.opacity = layers[i].o * fade;
    });
  });

  return (
    <group>
      {layers.map((l, i) => (
        <sprite key={i} position={[0, 3, l.z]} scale={[l.s, l.s, 1]}>
          <spriteMaterial
            ref={(el) => (mats.current[i] = el)}
            map={tex}
            color={l.c}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            opacity={0}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
