'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { motion } from '@/lib/motion';

/**
 * Light streaks — the speed channel. ONE instanced draw call of thin additive
 * quads lying along Z. They are static in the world; the camera flying past
 * provides the motion. A window of streaks is recycled around the camera in the
 * VERTEX SHADER (mod arithmetic on uCamZ), so the field is infinite and costs
 * zero per-frame CPU. uStretch elongates them with scroll velocity: streaks
 * become blades of light when you hammer the scroll.
 */

const COUNT = 240;

const VERT = /* glsl */ `
  attribute vec3 aData;   // x: lateral pos, y: height, z: seed
  attribute vec2 aCorner; // -1..1 across (x), -1..1 along (y)

  uniform float uTime;
  uniform float uCamZ;
  uniform float uStretch;
  uniform float uVelocity;

  varying float vFade;
  varying float vAccent;
  varying float vEdge;

  void main() {
    float lateral = aData.x;
    float height = aData.y;
    float seed = aData.z;

    // recycle streaks through a window that follows the camera
    float window = 120.0;
    float z = mod(seed * window - uCamZ, window) - window * 0.6 + uCamZ;

    float len = (0.5 + fract(seed * 7.31) * 1.6) * (1.0 + uStretch * 5.0);
    float wid = 0.02 + fract(seed * 3.17) * 0.02;

    vec3 world = vec3(
      lateral + aCorner.x * wid,
      height + aCorner.y * 0.015,
      z + aCorner.y * len
    );

    // fade in/out at the window edges so recycling is invisible
    float dist = abs(z - uCamZ);
    vFade = smoothstep(60.0, 20.0, dist) * smoothstep(0.0, 6.0, dist);
    // soft edges along the blade so it reads as light, not a rectangle
    vEdge = smoothstep(0.0, 0.35, abs(aCorner.y));
    vAccent = step(0.85, fract(seed * 13.7));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform float uVelocity;
  varying float vFade;
  varying float vAccent;
  varying float vEdge;

  void main() {
    vec3 cool = vec3(0.55, 0.68, 1.0);
    vec3 hot = vec3(1.0, 0.5, 0.25);
    vec3 col = mix(cool, hot, vAccent);
    // streaks only materialize with speed: invisible at rest, blades at sprint
    float speedGate = smoothstep(0.04, 0.4, uVelocity);
    gl_FragColor = vec4(col * 2.2, vFade * vEdge * speedGate * 0.9);
  }
`;

export default function Streaks() {
  const matRef = useRef();

  const { geometry } = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1); // corners at ±0.5, we remap
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('uv', base.attributes.uv);

    const data = new Float32Array(COUNT * 3);
    const corner = new Float32Array(COUNT * 4 * 2); // 4 verts per instance

    // Expand the plane's 4 vertices into per-instance corner attribute:
    // instance i owns vertices [i*4, i*4+4).
    const posAttr = base.attributes.position;
    for (let i = 0; i < COUNT; i++) {
      data[i * 3] = (Math.random() - 0.5) * 18; // lateral
      data[i * 3 + 1] = 0.15 + Math.random() * 3.6; // height
      data[i * 3 + 2] = Math.random(); // seed
      for (let v = 0; v < 4; v++) {
        const cx = posAttr.getX(v) * 2; // -1..1
        const cy = posAttr.getY(v) * 2;
        corner[(i * 4 + v) * 2] = cx;
        corner[(i * 4 + v) * 2 + 1] = cy;
      }
    }
    geo.setAttribute('aData', new THREE.InstancedBufferAttribute(data, 3));
    geo.setAttribute('aCorner', new THREE.InstancedBufferAttribute(corner, 2));
    geo.instanceCount = COUNT;
    base.dispose();

    return { geometry: geo };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamZ: { value: 6 },
      uStretch: { value: 0 },
      uVelocity: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uCamZ.value = motion.camZ;
    u.uStretch.value = motion.velocity;
    u.uVelocity.value = motion.velocity;
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
