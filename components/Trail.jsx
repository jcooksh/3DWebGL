'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { motion } from '@/lib/motion';
import { getGlowTexture } from '@/lib/glowTexture';

const TRAIL = 14;

/**
 * After-images of the runner: camera-facing glow sprites laid out along the
 * stride path. Positions derive from the shared stride phase, so steps and
 * after-images stay tied to metres, not time. Sprites (not world-plane quads)
 * because they always face the camera and sort correctly — world quads read as
 * screen-filling blobs when the camera passes through their plane. Each sprite
 * owns a cloned material with a static opacity falloff; per frame only
 * position/scale change.
 */
export default function Trail() {
  const sprites = useRef([]);
  const glowTex = useMemo(() => getGlowTexture(), []);

  const items = useMemo(
    () =>
      Array.from({ length: TRAIL }, (_, i) => ({
        k: 1 - i / TRAIL, // 1 → 0 along the trail
        opacity: 0.55 * (1 - i / TRAIL),
      })),
    [],
  );

  useFrame((state) => {
    for (let i = 0; i < TRAIL; i++) {
      const el = sprites.current[i];
      if (!el) continue;
      const ph = motion.sparkPhase - (i + 1) * 0.55;
      const yy = 1.2 + Math.abs(Math.sin(ph)) * 0.4;
      el.position.set(0, yy, motion.sparkZ + (i + 1) * 0.45);
      const s = 0.8 * items[i].k + 0.18;
      el.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      {items.map((it, i) => (
        <sprite
          key={i}
          ref={(el) => (sprites.current[i] = el)}
          position={[0, 1.2, 0.45]}
        >
          <spriteMaterial
            map={glowTex}
            color="#ff6a3d"
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            opacity={it.opacity}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
