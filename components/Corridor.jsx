'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TRACK_LENGTH, SCENE_FOG } from '@/lib/constants';
import { motion } from '@/lib/motion';

/**
 * Neon corridor, rebuilt as ONE instanced draw call with a custom shader:
 *  - brightness pulse waves race down the corridor (uTime, GPU-side)
 *  - accent bars flicker like faulty neon
 *  - bars SWELL as the camera passes them (uCamZ proximity in the vertex shader)
 *  - vertical emissive gradient pools light at the base for the floor reflection
 *  - manual fog in the fragment shader so bars melt into the dark with depth
 * Static geometry, zero per-frame CPU beyond two uniform writes.
 */

const VERT = /* glsl */ `
  attribute vec3 aOffset;   // x, z (y unused), base at y=0
  attribute float aHeight;
  attribute float aAccent;
  attribute float aSeed;

  uniform float uTime;
  uniform float uCamZ;

  varying vec2 vUv;
  varying float vAccent;
  varying float vSeed;
  varying float vPulse;
  varying float vSwell;
  varying float vDepth;

  void main() {
    vUv = uv;
    vAccent = aAccent;
    vSeed = aSeed;

    // camera-proximity swell: bars flare up/outward as you pass them
    float dCam = abs(aOffset.z - uCamZ);
    float swell = smoothstep(7.0, 0.5, dCam);
    vSwell = swell;

    vec3 pos = position;
    pos.y *= aHeight * (1.0 + swell * 0.25);
    pos.xz *= 1.0 + swell * 1.0;

    float baseY = aHeight * 0.5 * (1.0 + swell * 0.3);
    vec3 world = vec3(aOffset.x, baseY, aOffset.z) + pos;

    // pulse wave racing down the corridor
    vPulse = 0.55 + 0.45 * sin(aOffset.z * 0.22 + uTime * 2.6 + aSeed * 6.2831);

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uTime;

  varying vec2 vUv;
  varying float vAccent;
  varying float vSeed;
  varying float vPulse;
  varying float vSwell;
  varying float vDepth;

  void main() {
    // cool ice neon, hot accent orange — saturated enough to survive ACES
    vec3 cool = vec3(0.5, 0.68, 1.0);
    vec3 hot  = vec3(1.0, 0.3, 0.14);
    vec3 col  = mix(cool, hot, vAccent);

    // flicker only on accent bars — faulty-neon shimmer
    float flick = 1.0;
    if (vAccent > 0.5) {
      flick = 0.72 + 0.28 * sin(uTime * 13.0 + vSeed * 40.0)
                    * sin(uTime * 7.7 + vSeed * 17.0);
    }

    // emissive gradient: hot base pooling onto the floor, dimmer tip
    float grad = 1.15 - vUv.y * 0.55;

    // soften the sides like a rounded neon tube
    float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);

    float energy = vPulse * flick * grad * (1.0 + vSwell * 0.8);

    col *= energy * 1.35 * edge;

    // manual fog to match the scene
    float fogF = smoothstep(uFogNear, uFogFar, vDepth);
    col = mix(col, uFogColor, fogF);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Corridor() {
  const matRef = useRef();

  const { geometry, count } = useMemo(() => {
    const spacing = 2.2;
    const n = Math.floor((TRACK_LENGTH + 40) / spacing);
    const rows = [];

    for (let i = 0; i < n; i++) {
      const z = 8 - i * spacing;
      const h = 1.6 + ((i * 37) % 11) * 0.2;
      const accent = i % 9 === 0;
      rows.push({ x: -2.6, z, h, accent, seed: (i * 0.618) % 1 });
      rows.push({ x: 2.6, z, h, accent, seed: (i * 0.618 + 0.37) % 1 });
    }

    const box = new THREE.BoxGeometry(0.07, 1, 0.07);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = box.index;
    geo.setAttribute('position', box.attributes.position);
    geo.setAttribute('normal', box.attributes.normal);
    geo.setAttribute('uv', box.attributes.uv);

    const m = rows.length;
    const off = new Float32Array(m * 3);
    const hei = new Float32Array(m);
    const acc = new Float32Array(m);
    const sed = new Float32Array(m);
    rows.forEach((r, i) => {
      off[i * 3] = r.x;
      off[i * 3 + 1] = 0;
      off[i * 3 + 2] = r.z;
      hei[i] = r.h;
      acc[i] = r.accent ? 1 : 0;
      sed[i] = r.seed;
    });
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 3));
    geo.setAttribute('aHeight', new THREE.InstancedBufferAttribute(hei, 1));
    geo.setAttribute('aAccent', new THREE.InstancedBufferAttribute(acc, 1));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sed, 1));
    geo.instanceCount = m;
    box.dispose();

    return { geometry: geo, count: m };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamZ: { value: 6 },
      uFogColor: { value: new THREE.Color(SCENE_FOG.color) },
      uFogNear: { value: SCENE_FOG.near },
      uFogFar: { value: SCENE_FOG.far },
    }),
    [],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uCamZ.value = motion.camZ;
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
      />
    </mesh>
  );
}
