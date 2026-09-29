'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';
import Corridor from './Corridor';
import Spark from './Spark';
import Trail from './Trail';
import Ripples from './Ripples';
import Background from './Background';
import Rig from './Rig';
import PostFX from './PostFX';
import Streaks from './Streaks';
import GridFloor from './GridFloor';
import Motion from './Motion';
import { TRACK_LENGTH, SCENE_FOG } from '@/lib/constants';
import { getGlowTexture } from '@/lib/glowTexture';

// Faint drifting motes for atmosphere + parallax depth. Rebuilt as ONE
// instanced draw call of additive glow sprites (was: hard square points).
function Motes() {
  const tex = useMemo(() => getGlowTexture(), []);

  const { geo, mat } = useMemo(() => {
    const n = 500;
    const off = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      off[i * 3] = (Math.sin(i * 12.9898) * 0.5 + 0.5 - 0.5) * 22;
      off[i * 3 + 1] = Math.abs(Math.sin(i * 78.233) * 0.5 + 0.5) * 9;
      off[i * 3 + 2] = (i / n) * -(TRACK_LENGTH + 30) + 8;
      seed[i] = (i * 0.618) % 1;
    }
    const g = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    g.index = base.index;
    g.setAttribute('position', base.attributes.position);
    g.setAttribute('uv', base.attributes.uv);
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 3));
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
    g.instanceCount = n;
    base.dispose();

    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uMap: { value: tex }, uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 aOffset;
        attribute float aSeed;
        uniform float uTime;
        varying vec2 vUv;
        varying float vTwinkle;
        void main() {
          vUv = uv;
          vec3 p = aOffset;
          p.x += sin(uTime * 0.3 + aSeed * 6.2831) * 0.6;
          p.y += sin(uTime * 0.2 + aSeed * 12.0) * 0.4;
          p.z += sin(uTime * 0.11 + aSeed * 31.0) * 1.2;
          vTwinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.7 + aSeed * 40.0));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec2 vUv;
        varying float vTwinkle;
        void main() {
          vec4 t = texture2D(uMap, vUv);
          vec3 col = mix(vec3(0.62, 0.69, 1.0), vec3(1.0, 0.62, 0.42), step(0.88, vTwinkle));
          gl_FragColor = vec4(col, t.a * vTwinkle * 0.5);
        }
      `,
    });
    return { geo: g, mat: m };
  }, [tex]);

  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.9, 6], fov: 46, near: 0.1, far: 400 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;
        scene.background = new THREE.Color(SCENE_FOG.color);
        scene.fog = new THREE.Fog(SCENE_FOG.color, SCENE_FOG.near, SCENE_FOG.far);
        if (typeof window !== 'undefined') window.__TRACK_SCENE = scene; // debug handle
      }}
    >
      {/* FIRST: the shared motion step — sole writer of lib/motion state. */}
      <Motion />

      {/* Mostly emissive-lit. A dim key just to shape the reflective floor. */}
      <ambientLight intensity={0.16} />
      <directionalLight position={[4, 10, 2]} intensity={0.4} color="#aab4ff" />

      <Background />

      <Suspense fallback={null}>
        {/* Reflective floor — reflects the neon corridor + the spark. */}
        <mesh rotation-x={-Math.PI / 2} position-y={0}>
          <planeGeometry args={[44, TRACK_LENGTH * 2.6]} />
          <MeshReflectorMaterial
            resolution={1024}
            blur={[400, 120]}
            mixBlur={1}
            mixStrength={3.5}
            roughness={0.85}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            color="#06060a"
            metalness={0.7}
          />
        </mesh>

        <GridFloor />
        <Corridor />
        <Streaks />
        <Spark />
        <Trail />
        <Ripples />
        <Motes />
      </Suspense>

      <Rig />
      <PostFX />
    </Canvas>
  );
}
