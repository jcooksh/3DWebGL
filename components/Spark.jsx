'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useProgress } from '@/lib/store';
import { trackEase } from '@/lib/ease';
import { TRACK_LENGTH, STEP_FREQ } from '@/lib/constants';

const TRAIL = 12;

/**
 * The "runner of light" — a hot core orb with a lagging motion trail. The stride
 * bob and the trail spacing are both driven by DISTANCE travelled, so steps and
 * after-images stay tied to metres regardless of scroll speed (the TRACK feel).
 *
 * Swap in a real Blender GLB here exactly as noted before (useGLTF +
 * useAnimations, scrub clip time by distance) if you want a literal figure.
 */
export default function Spark() {
  const main = useRef();
  const trail = useRef([]);

  useFrame(() => {
    const d = trackEase(useProgress.getState().progress);
    const baseZ = -d * TRACK_LENGTH;
    const phase = d * TRACK_LENGTH * STEP_FREQ;
    const y = 1.2 + Math.abs(Math.sin(phase)) * 0.4;

    if (main.current) main.current.position.set(0, y, baseZ);

    for (let i = 0; i < TRAIL; i++) {
      const t = trail.current[i];
      if (!t) continue;
      const lag = (i + 1) * 0.55;
      const ph = phase - lag;
      const yy = 1.2 + Math.abs(Math.sin(ph)) * 0.4;
      const k = 1 - i / TRAIL;
      t.position.set(0, yy, baseZ + (i + 1) * 0.45);
      t.scale.setScalar(0.26 * k);
    }
  });

  return (
    <group>
      <mesh ref={main}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshBasicMaterial color="#fff3e6" toneMapped={false} />
        {/* warm light that travels with the orb and catches the floor + bars */}
        <pointLight intensity={9} distance={14} decay={2} color="#ff7a45" />
      </mesh>

      {Array.from({ length: TRAIL }).map((_, i) => (
        <mesh key={i} ref={(el) => (trail.current[i] = el)}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color="#ff6a3d"
            toneMapped={false}
            transparent
            opacity={1 - i / TRAIL}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
