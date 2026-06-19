'use client';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

// The "metronome" reveal curve — a bespoke CustomEase shapes how scroll distance
// maps to scene/HUD progress. Tune the bezier to change the cadence/feel.
// `trackEase(p)` is a pure (0..1) -> (0..1) function usable anywhere.
export const trackEase = CustomEase.create('trackEase', 'M0,0 C0.16,0 0.3,1 1,1');
