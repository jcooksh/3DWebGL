'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';
import Corridor from './Corridor';
import Spark from './Spark';
import Background from './Background';
import Rig from './Rig';
import PostFX from './PostFX';
import { TRACK_LENGTH } from '@/lib/constants';

// Faint drifting motes for atmosphere + parallax depth as the camera moves.
function Motes() {
  const geo = useMemo(() => {
    const n = 500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.sin(i * 12.9898) * 0.5 + 0.5 - 0.5) * 22;
      pos[i * 3 + 1] = Math.abs(Math.sin(i * 78.233) * 0.5 + 0.5) * 9;
      pos[i * 3 + 2] = (i / n) * -(TRACK_LENGTH + 30) + 8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.035} color="#9fb0ff" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.9, 6], fov: 46, near: 0.1, far: 400 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
        scene.background = new THREE.Color('#050509');
        scene.fog = new THREE.Fog('#050509', 18, 90);
      }}
    >
      {/* Mostly emissive-lit. A dim key just to shape the reflective floor. */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[4, 10, 2]} intensity={0.35} color="#aab4ff" />

      <Background />

      <Suspense fallback={null}>
        {/* Reflective floor — reflects the neon corridor + the spark. */}
        <mesh rotation-x={-Math.PI / 2} position-y={0}>
          <planeGeometry args={[44, TRACK_LENGTH * 2.6]} />
          <MeshReflectorMaterial
            resolution={1024}
            blur={[400, 120]}
            mixBlur={1}
            mixStrength={3}
            roughness={0.85}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.2}
            color="#06060a"
            metalness={0.7}
          />
        </mesh>

        <Corridor />
        <Spark />
        <Motes />
      </Suspense>

      <Rig />
      <PostFX />
    </Canvas>
  );
}
