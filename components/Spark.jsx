'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { motion } from '@/lib/motion';
import { getGlowTexture } from '@/lib/glowTexture';

const coreVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

// Fresnel shader ball: white-hot facing center, electric rim, gentle animated
// surface wobble via 3D value noise. All per-fragment, zero CPU per frame.
const coreFrag = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.0);

    // plasma wobble: two octaves of animated value noise
    float n = noise(N * 3.0 + vec3(0.0, uTime * 0.7, uTime * 0.45));
    n += 0.5 * noise(N * 7.0 + vec3(uTime * 0.9, 0.0, uTime * 0.6));

    vec3 hot  = vec3(1.0, 0.97, 0.90);           // near-white core
    vec3 rim  = vec3(1.0, 0.42, 0.18);           // electric orange rim
    vec3 deep = vec3(0.85, 0.16, 0.05);          // shadow-side ember

    float side = 0.5 + 0.5 * N.y;                // fake top-light shaping
    vec3 col = mix(deep, hot, smoothstep(0.15, 0.75, side) * (1.0 - fres));
    col = mix(col, rim, fres);
    col += (n - 0.75) * 0.35;                    // plasma flicker

    // hot core boost so bloom grabs the center hard
    float core = pow(max(dot(N, V), 0.0), 3.0);
    col += hot * core * 0.8;

    gl_FragColor = vec4(col * 1.25, 1.0);
  }
`;

/**
 * The runner of light — head only: fresnel/plasma shader ball, camera-facing
 * glow halo, and the point light that catches floor and bars. Position comes
 * from the shared motion state (sole writer: <Motion/>). Companions:
 * Trail.jsx (after-images) and Ripples.jsx (footfall rings).
 */
export default function Spark() {
  const head = useRef();
  const glow = useRef();
  const glowTex = useMemo(() => getGlowTexture(), []);

  useFrame((state) => {
    const y = 1.2 + Math.abs(Math.sin(motion.sparkPhase)) * 0.4;
    if (head.current) {
      head.current.position.set(0, y, motion.sparkZ);
      head.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (glow.current) {
      glow.current.position.set(0, y, motion.sparkZ);
      const s = 2.1 + Math.sin(state.clock.elapsedTime * 2.3) * 0.12;
      glow.current.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      {/* fresnel/plasma head */}
      <mesh ref={head}>
        <sphereGeometry args={[0.28, 48, 48]} />
        <shaderMaterial
          vertexShader={coreVert}
          fragmentShader={coreFrag}
          uniforms={{ uTime: { value: 0 } }}
        />
        {/* warm light that catches the floor + bars */}
        <pointLight intensity={9} distance={14} decay={2} color="#ff7a45" />
      </mesh>

      {/* camera-facing light halo (reads as light, not geometry) */}
      <sprite ref={glow} position={[0, 1.2, 0]}>
        <spriteMaterial
          map={glowTex}
          color="#ff8a50"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          opacity={0.32}
        />
      </sprite>
    </group>
  );
}
