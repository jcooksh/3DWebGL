'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TRACK_LENGTH, SCENE_FOG } from '@/lib/constants';
import { motion } from '@/lib/motion';

/**
 * Emissive wireframe floor grid — Tron-style perspective read. ONE draw call.
 * The grid is static; the camera motion animates it. Lines pulse brightness
 * traveling toward the camera (GPU time term), and it fades with distance so
 * it melts into the fog like everything else.
 */
export default function GridFloor() {
  const matRef = useRef();

  const geo = useMemo(() => {
    const spacing = 2.2; // match corridor bar cadence
    const n = Math.ceil((TRACK_LENGTH + 40) / spacing);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const z = 8 - i * spacing;
      pts.push(-13, 0.015, z, 13, 0.015, z); // one line segment across
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamZ: { value: 6 },
      uFogColor: { value: new THREE.Color(SCENE_FOG.color) },
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
    <lineSegments geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying float vZ;
          void main() {
            vZ = position.z;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          uniform float uCamZ;
          uniform vec3 uFogColor;
          varying float vZ;
          void main() {
            // pulse running toward the camera
            float pulse = 0.45 + 0.55 * sin(vZ * 0.22 - uTime * 2.6);
            vec3 col = vec3(0.16, 0.28, 0.55) * pulse * 1.6;

            // crossline flare as it passes the camera
            float near = smoothstep(9.0, 0.0, abs(vZ - uCamZ));
            col += vec3(0.35, 0.5, 0.9) * near * 0.5;

            float fogF = smoothstep(18.0, 90.0, -vZ + uCamZ);
            col = mix(col, uFogColor, fogF);
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </lineSegments>
  );
}
