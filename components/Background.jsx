'use client';
import { useMemo } from 'react';
import * as THREE from 'three';
import { TRACK_LENGTH } from '@/lib/constants';

/**
 * "Light at the end of the tunnel" — a soft additive glow sprite far down the
 * corridor. Generated from a canvas radial gradient (no network asset). The
 * sprite always faces the camera, so it reads as atmospheric depth/haze.
 */
export default function Background() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,128,72,0.95)');
    g.addColorStop(0.35, 'rgba(150,70,130,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }, []);

  return (
    <sprite position={[0, 3, -TRACK_LENGTH - 12]} scale={[70, 70, 1]}>
      <spriteMaterial
        map={tex}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        opacity={0.9}
        toneMapped={false}
      />
    </sprite>
  );
}
