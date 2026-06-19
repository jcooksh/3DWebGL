'use client';
import { useEffect, useRef } from 'react';
import { useProgress } from '@/lib/store';
import { trackEase } from '@/lib/ease';
import { TOTAL_METERS } from '@/lib/constants';

// Quotes "earned" at distance thresholds — same idea as TRACK surfacing icon
// quotes as you put in the work.
const QUOTES = [
  { at: 0.2, text: "I DON'T THINK LIMITS", who: 'USAIN BOLT' },
  { at: 0.46, text: 'HARD WORK BEATS TALENT', who: 'TIM NOTKE' },
  { at: 0.72, text: 'PAIN IS TEMPORARY', who: 'LANCE ARMSTRONG' },
  { at: 0.93, text: 'THE TRACE OF ICONS', who: '' },
];

function fmtTime(p) {
  // Stopwatch climbs to ~90s across the full run. Format MM:SS:CS.
  const totalCs = Math.floor(p * 90 * 100);
  const m = String(Math.floor(totalCs / 6000)).padStart(2, '0');
  const s = String(Math.floor((totalCs % 6000) / 100)).padStart(2, '0');
  const cs = String(totalCs % 100).padStart(2, '0');
  return `${m}:${s}:${cs}`;
}

/**
 * DOM HUD composited over the WebGL canvas. Updated imperatively from a single
 * rAF loop reading the store — no React re-renders per frame, so the type stays
 * crisp, selectable and cheap. Everything here reads the same scroll scalar the
 * 3D scene does.
 */
export default function HUD() {
  const timeRef = useRef(null);
  const distRef = useRef(null);
  const barRef = useRef(null);
  const quoteRefs = useRef([]);

  useEffect(() => {
    let raf;
    const loop = () => {
      const p = useProgress.getState().progress;
      const d = trackEase(p);

      if (timeRef.current) timeRef.current.textContent = fmtTime(p);
      if (distRef.current) {
        distRef.current.textContent =
          String(Math.floor(d * TOTAL_METERS)).padStart(4, '0') + 'm';
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

      QUOTES.forEach((q, i) => {
        const el = quoteRefs.current[i];
        if (!el) return;
        // Fade each quote in near its threshold, out as you scroll past.
        const vis = Math.max(0, 1 - Math.abs(p - q.at) / 0.07);
        el.style.opacity = String(trackEase(Math.min(1, vis)));
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hud">
      <div className="hud__meters">
        <span className="hud__label">TIME</span>
        <span className="hud__time" ref={timeRef}>00:00:00</span>
        <span className="hud__dist" ref={distRef}>0000m</span>
      </div>

      <div className="hud__name">
        TRACK
        <br />
        THE TRACE OF ICONS
      </div>

      <div className="hud__quotes">
        {QUOTES.map((q, i) => (
          <figure
            className="hud__quote"
            key={q.text}
            ref={(el) => (quoteRefs.current[i] = el)}
          >
            <div className="hud__quote-text">{q.text}</div>
            {q.who && <figcaption className="hud__quote-who">{q.who}</figcaption>}
          </figure>
        ))}
      </div>

      <div className="hud__hint">SCROLL TO RUN</div>
      <div className="hud__bar" ref={barRef} />
    </div>
  );
}
