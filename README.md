# TRACK — scroll-paced WebGL starter

A minimal, working clone of the architecture behind [hirotos.com](https://www.hirotos.com/)'s
**TRACK** demo: a scroll-driven WebGL "run" where one scroll scalar drives the
camera, a running figure, and a DOM HUD (stopwatch + distance counter + quotes
that surface as you earn them).

## Stack (mirrors what was found in TRACK's shipped bundle)

| Concern        | Choice |
|----------------|--------|
| Framework      | Next.js (App Router, **static export** → `out/`) |
| 3D             | three.js + **react-three-fiber** + drei |
| Post-processing| **@react-three/postprocessing** (Noise + Vignette only) |
| Animation      | **GSAP** ScrollTrigger + **CustomEase** |
| Smooth scroll  | **Lenis** |
| State          | zustand (one scalar: `progress`) |
| Hosting        | any static host / nginx — no server runtime, no Vercel needed |

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 — scroll to run
npm run build        # static export to ./out
npm start            # serve the built ./out locally
```

## How it works

1. **`components/ScrollController.jsx`** — Lenis smooths wheel/touch input; GSAP
   ScrollTrigger turns scroll position over a tall (`700vh`) container into a
   `0..1` progress value and writes it to the zustand store.
2. **`lib/store.js`** — the single source of truth. Read imperatively with
   `useProgress.getState()` inside frame/rAF loops so nothing re-renders React.
3. **`lib/ease.js`** — a bespoke **CustomEase** (`trackEase`) shapes how distance
   maps to motion. This is the "metronome" cadence knob.
4. **`components/Rig.jsx` / `Runner.jsx`** — both read the same scalar each frame.
   Stride cadence is tied to **distance**, not time — the defining TRACK trait.
5. **`components/HUD.jsx`** — DOM overlay updated from one rAF loop; stopwatch,
   distance, and distance-gated quotes all read the same scalar.

## Make it yours

- **Real character:** drop a Blender-exported GLB with a baked `run` clip into
  `public/models/` and follow the swap block commented in `components/Runner.jsx`
  (`useGLTF` + `useAnimations`, scrub the clip time by distance).
- **Pacing/feel:** edit the `trackEase` bezier in `lib/ease.js`.
- **Run length:** `TRACK_LENGTH` in `lib/constants.js` + `.scroll-spacer` height
  in `app/globals.css`.
- **Look:** materials are plain PBR; swap to `meshMatcapMaterial` for the cheap,
  art-directed matcap shading TRACK uses, or add custom GLSL.

## Notes

This is a from-scratch educational starter inspired by publicly observable
techniques. It ships no assets from hirotos.com.
