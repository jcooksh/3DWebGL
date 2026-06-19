'use client';
import { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { TRACK_LENGTH } from '@/lib/constants';

/**
 * Two rows of emissive neon bars lining the run. Bright (toneMapped off) so the
 * Bloom pass turns them into glowing streaks that rush past = sense of speed.
 * One InstancedMesh, a few hundred instances — cheap.
 */
export default function Corridor() {
  const bars = useMemo(() => {
    const arr = [];
    const spacing = 2.2;
    const n = Math.floor((TRACK_LENGTH + 40) / spacing);
    for (let i = 0; i < n; i++) {
      const z = 8 - i * spacing;
      const h = 1.6 + ((i * 37) % 11) * 0.2; // deterministic pseudo-random heights
      const accent = i % 9 === 0;
      arr.push({ x: -2.6, z, h, accent });
      arr.push({ x: 2.6, z, h, accent });
    }
    return arr;
  }, []);

  return (
    <Instances limit={bars.length} range={bars.length} frustumCulled={false}>
      <boxGeometry args={[0.07, 1, 0.07]} />
      <meshBasicMaterial toneMapped={false} />
      {bars.map((b, i) => (
        <Instance
          key={i}
          position={[b.x, b.h / 2, b.z]}
          scale={[1, b.h, 1]}
          color={b.accent ? '#ff4d2e' : '#cdd8ff'}
        />
      ))}
    </Instances>
  );
}
