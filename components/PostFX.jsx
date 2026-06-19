'use client';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

/**
 * Bloom makes the emissive corridor + spark read as expensive neon. The rest is
 * restrained: a touch of chromatic aberration at the edges, vignette, and subtle
 * film grain — the TRACK look. No DoF, no heavy effects.
 */
export default function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={0.12}
        luminanceSmoothing={0.9}
        intensity={0.95}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0006, 0.0009)}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette offset={0.2} darkness={0.78} eskil={false} />
      <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} premultiply />
    </EffectComposer>
  );
}
