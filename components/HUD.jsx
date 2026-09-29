'use client';
import { useEffect, useRef } from 'react';
import { motion } from '@/lib/motion';
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

export default function HUD() {
  const timeRef = useRef(null);
  const distRef = useRef(null);
  const barRef = useRef(null);
  const paceRef = useRef(null);
  const hintRef = useRef(null);
  const ghostRef = useRef(null);
  const quoteRefs = useRef([]);

  useEffect(() => {
    let raf;
    let lastCs = -1;
    let lastM = -1;
    let hintGone = false;

    const loop = () => {
      const p = motion.progress;
      const d = motion.dist ?? 0;
      const v = motion.velocity;

      // stopwatch: only touch the DOM when the centisecond digit changes
      const totalCs = Math.floor(p * 90 * 100);
      if (totalCs !== lastCs && timeRef.current) {
        const m = String(Math.floor(totalCs / 6000)).padStart(2, '0');
        const s = String(Math.floor((totalCs % 6000) / 100)).padStart(2, '0');
        const cs = String(totalCs % 100).padStart(2, '0');
        timeRef.current.textContent = `${m}:${s}:${cs}`;
        lastCs = totalCs;
      }

      if (distRef.current) {
        const m = Math.floor(d * TOTAL_METERS);
        if (m !== lastM) {
          distRef.current.textContent = String(m).padStart(4, '0') + 'm';
          lastM = m;
        }
      }

      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

      if (paceRef.current) {
        const pace = (6.5 - v * 2.2).toFixed(2);
        const sprinting = v > 0.45;
        paceRef.current.textContent = `${pace} min/km ${sprinting ? '· SPRINT' : ''}`;
        paceRef.current.style.color = sprinting ? '#ffd0a0' : '';
      }

      if (ghostRef.current) {
        ghostRef.current.style.transform = `translateX(${p * -100}%)`;
      }

      if (hintRef.current && !hintGone) {
        const o = Math.max(0, 1 - p / 0.05);
        hintRef.current.style.opacity = String(o);
        if (o === 0) {
          hintRef.current.style.display = 'none';
          hintGone = true;
        }
      }

      QUOTES.forEach((q, i) => {
        const el = quoteRefs.current[i];
        if (!el) return;
        const vis = Math.max(0, 1 - Math.abs(p - q.at) / 0.07);
        const e = trackEase(Math.min(1, vis));
        el.style.opacity = String(e);
        // kinetic reveal: rises from below with letter-spacing collapse
        el.style.transform = `translateY(${(1 - e) * 34}px) scale(${0.965 + e * 0.035})`;
        el.style.filter = `blur(${(1 - e) * 14}px)`;
        el.style.letterSpacing = `${(1 - e) * 0.12 + 0.005}em`;
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
        <span className="hud__pace" ref={paceRef}>6.50 min/km</span>
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

      <div className="hud__hint" ref={hintRef}>SCROLL TO RUN</div>
      <div className="hud__split" ref={ghostRef} aria-hidden="true" />
      <div className="hud__bar" ref={barRef} />
    </div>
  );
}
