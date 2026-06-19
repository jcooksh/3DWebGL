'use client';
import dynamic from 'next/dynamic';
import ScrollController from './ScrollController';
import HUD from './HUD';

// The WebGL canvas is loaded client-only — never server-rendered. This is the
// standard R3F + static-export pattern (mirrors how hirotos.com ships a near-empty
// HTML shell that hydrates into a full WebGL scene).
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => null,
});

export default function Experience() {
  return (
    <>
      {/* side-effect only: wires Lenis smooth-scroll + GSAP ScrollTrigger -> store */}
      <ScrollController />

      <div className="canvas-wrap">
        <Scene />
      </div>

      <HUD />

      {/* The tall spacer is what you actually scroll. Its height (700vh in
          globals.css) sets how "long" the run is. */}
      <main className="scroll-spacer" aria-hidden="true">
        <p className="section" style={{ top: '8vh' }}>00 · On your marks</p>
        <p className="section" style={{ top: '120vh' }}>01 · The pace is set by the distance you cover</p>
        <p className="section" style={{ top: '320vh' }}>02 · Every metre is earned</p>
        <p className="section" style={{ top: '560vh' }}>03 · The trace of icons</p>
      </main>
    </>
  );
}
