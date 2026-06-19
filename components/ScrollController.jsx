'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useProgress } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

/**
 * The scroll engine. Three pieces working together:
 *  1. Lenis smooths raw wheel/touch input into eased scroll position.
 *  2. GSAP ScrollTrigger reads that position and produces a 0..1 `progress`.
 *  3. progress is written into the zustand store — the scene's single scalar.
 *
 * Because progress is driven by scroll *position* over a tall fixed container,
 * it is effectively "distance scrolled", which is exactly the TRACK mechanic.
 */
export default function ScrollController() {
  useEffect(() => {
    const { setProgress } = useProgress.getState();

    const lenis = new Lenis({ smoothWheel: true, lerp: 0.1, wheelMultiplier: 1 });

    // Drive Lenis from GSAP's ticker and keep ScrollTrigger in sync with it.
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const st = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      scrub: true,
      onUpdate: (self) => setProgress(self.progress),
      invalidateOnRefresh: true,
    });

    return () => {
      st.kill();
      gsap.ticker.remove(raf);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
    };
  }, []);

  return null;
}
