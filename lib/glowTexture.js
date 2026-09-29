'use client';
import * as THREE from 'three';

/**
 * Shared soft radial glow texture, generated once from a canvas (no network
 * asset). Used by the spark trail, the motes and the tunnel-end glow — anything
 * that needs to read as "light" rather than geometry.
 */
let cached = null;

export function getGlowTexture() {
  if (cached) return cached;

  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  cached = new THREE.CanvasTexture(c);
  cached.needsUpdate = true;
  return cached;
}
