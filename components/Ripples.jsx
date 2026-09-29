'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { motion } from '@/lib/motion';

const MAX_RIPPLES = 5;
const LIFE = 0.9;

// Ring shader: alpha lives only in the outer band, fading with expansion.
const rippleMat = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float band = smoothstep(0.75, 1.0, r) * (1.0 - smoothstep(0.98, 1.0, r));
        float a = band * (1.0 - r * 0.35);
        vec3 col = mix(vec3(1.0, 0.45, 0.2), vec3(1.0, 0.85, 0.6), r) * 0.75;
        gl_FragColor = vec4(col, a * 0.5);
      }
    `,
  });

/**
 * Footfall ripples: ONE InstancedMesh of floor rings; a ring spawns each half
 * stride (distance-driven, so cadence follows metres not seconds) and expands
 * + fades over its lifetime. Owns only its spawn state machine.
 */
export default function Ripples() {
  const rippleRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mat = useMemo(rippleMat, []);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const ripples = useRef(Array.from({ length: MAX_RIPPLES }, () => ({ ph: -1 })));

  useFrame((state) => {
    const r = ripples.current;
    const step = Math.floor(motion.sparkPhase / Math.PI);
    if (r._lastStep === undefined) r._lastStep = step;
    if (step !== r._lastStep) {
      let slot = r.findIndex((x) => x.ph < 0);
      if (slot < 0) slot = 0;
      r[slot].ph = 0;
      r[slot].x = (Math.random() - 0.5) * 0.7;
      r[slot].z = motion.sparkZ;
      r._lastStep = step;
    }

    if (!rippleRef.current) return;
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const rp = r[i];
      if (rp.ph >= 0) {
        rp.ph += state.clock.deltaTime ?? 0.016;
        if (rp.ph > LIFE) rp.ph = -1;
      }
      const alive = rp.ph >= 0;
      dummy.position.set(alive ? rp.x : 0, 0.02, alive ? rp.z : 0);
      const t = alive ? rp.ph / LIFE : 0;
      const s = alive ? 0.4 + t * 1.9 : 0;
      dummy.scale.set(s, s, 1);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      rippleRef.current.setMatrixAt(i, dummy.matrix);
    }
    rippleRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={rippleRef}
      args={[geo, mat, MAX_RIPPLES]}
      frustumCulled={false}
    />
  );
}
