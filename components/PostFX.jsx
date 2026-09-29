'use client';
import { useRef } from 'react';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from '@/lib/motion';

/**
 * Post stack — the fx breathe with scroll VELOCITY:
 *  - bloom: threshold/intensity rise at speed (light smears when sprinting)
 *  - chromatic aberration: radial RGB split widens with speed (motion energy)
 *  - vignette: closes in slightly at speed (tunnel focus)
 *  - grain: stronger over the start sector, then settles
 * Every uniform write happens once per frame on refs — no React re-renders.
 */
export default function PostFX() {
  const bloomRef = useRef();
  const caRef = useRef();
  const vigRef = useRef();
  const noiseRef = useRef();

  const caOffset = useRef(new THREE.Vector2(0.0006, 0.0009));

  useFrame(() => {
    const v = motion.velocity;
    const d = motion.dist ?? 0;

    if (bloomRef.current) {
      bloomRef.current.intensity = 0.95 + v * 0.85;
      bloomRef.current.luminanceThreshold = 0.12 - v * 0.04;
    }
    if (caRef.current) {
      const k = 0.0006 + v * 0.0032;
      caOffset.current.set(k, k * 1.5);
      caRef.current.offset = caOffset.current;
    }
    if (vigRef.current) {
      vigRef.current.darkness = 0.74 + v * 0.16;
    }
    if (noiseRef.current) {
      noiseRef.current.opacity = 0.14 + Math.max(0, 0.35 - d) * 0.25;
    }
  });

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        ref={bloomRef}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.9}
        intensity={0.95}
        mipmapBlur
      />
      <ChromaticAberration
        ref={caRef}
        offset={caOffset.current}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette ref={vigRef} offset={0.2} darkness={0.74} eskil={false} />
      <Noise ref={noiseRef} blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.16} premultiply />
    </EffectComposer>
  );
}
