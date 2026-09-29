# TRACK — scroll-paced WebGL run

A scroll-driven WebGL experience: a "runner of light" sprints down a neon
corridor while a stopwatch, distance counter, and athlete quotes climb in sync.
Everything — camera, runner, HUD — is driven by **one scroll scalar**, and
reveals are paced to **distance travelled**, not viewport position.

Architecture and stack mirror the techniques observed on
[hirotos.com](https://www.hirotos.com/)'s **TRACK** demo. Built from scratch; no
assets are taken from that site.

![TRACK preview](./preview.png)

## Stack

| Concern          | Choice |
|------------------|--------|
| Framework        | Next.js (App Router, **static export** → `out/`) |
| 3D               | three.js · **react-three-fiber** · drei (`Instances`, `MeshReflectorMaterial`) |
| Post-processing  | **@react-three/postprocessing** — Bloom · ChromaticAberration · Vignette · Noise |
| Animation        | **GSAP** ScrollTrigger + **CustomEase** |
| Smooth scroll    | **Lenis** |
| State            | zustand — `progress` **+ smoothed `velocity`** (speed drives the FX) |
| Type             | `next/font` — Anton (display) + JetBrains Mono |
| Hosting          | any static host / nginx — no server runtime, no Vercel required |

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 — scroll to run
npm run build      # static export → ./out
npm start          # serve the built ./out locally
```

Requires Node 18+.

## How it works

```
scroll ──▶ Lenis (smoothing) ──▶ GSAP ScrollTrigger ──▶ progress (0..1)
                                                          │  zustand store
                 ┌────────────────────────┬──────────────┴───────────────┐
                 ▼                         ▼                              ▼
          Rig (camera)              Spark + Corridor                 HUD (DOM)
        chases the spark        scene scrubbed by distance      stopwatch · metres · quotes
```

1. **`components/ScrollController.jsx`** — Lenis smooths wheel/touch input; GSAP
   ScrollTrigger turns scroll position over a tall (`700vh`) container into a
   `0..1` `progress` and writes it to the store.
2. **`lib/store.js`** — single source of truth. Read imperatively with
   `useProgress.getState()` inside frame/rAF loops, so per-frame updates never
   re-render React.
3. **`lib/ease.js`** — a bespoke **CustomEase** (`trackEase`) shapes how distance
   maps to motion. This is the "metronome" cadence knob.
4. **`components/Rig.jsx` + `Spark.jsx`** — both read the same scalar each frame.
   Stride bob and trail spacing are tied to **distance**, not time. The rig also
   derives a smoothed **velocity** scalar and reacts to it: FOV pull, banking
   roll, speed shake, and dolly breathing.
5. **`components/HUD.jsx`** — DOM overlay updated from one rAF loop; stopwatch,
   distance, pace readout, and distance-gated quotes (kinetic blur/spacing
   reveal) all read the same scalar + velocity.
6. **Velocity channel** — `Streaks.jsx` (instanced light blades, gated by speed),
   `PostFX.jsx` (bloom / chromatic aberration / vignette ramp with speed). At
   rest the corridor is calm; hammer the scroll and it becomes a light tunnel.
7. **All hot geometry is custom instanced shaders** — `Corridor.jsx` (pulse
   waves, faulty-neon flicker, camera-proximity swell, manual fog), `Spark.jsx`
   (fresnel/plasma core, additive instanced after-image trail, footfall ripple
   rings), `GridFloor.jsx`, `Streaks.jsx`, `Motes` — one draw call per system,
   all animation GPU-side (`uTime` / `uCamZ` uniforms), zero per-frame CPU work
   beyond uniform writes.

## Project layout

```
app/
  layout.jsx        fonts + metadata
  page.jsx          renders <Experience/>
  globals.css       HUD + type system
components/
  Experience.jsx    wires ScrollController + (client-only) Scene + HUD + scroll spacer
  ScrollController  Lenis + GSAP ScrollTrigger → store
  Scene.jsx         <Canvas>, lights, reflective floor, motes
  Corridor.jsx      instanced neon bars — custom shader: pulse waves, flicker, swell, fog
  Spark.jsx         fresnel/plasma runner + instanced glow trail + footfall ripples
  Streaks.jsx       instanced light blades, gated by scroll velocity
  GridFloor.jsx     emissive pulsing wireframe floor (one lineSegments draw call)
  Background.jsx    distance-keyed portal glow ("light at the end of the tunnel")
  Rig.jsx           camera chase + velocity FOV/roll/shake, publishes `velocity`
  PostFX.jsx        Bloom + ChromaticAberration + Vignette + grain, velocity-reactive
  HUD.jsx           DOM stopwatch / distance / pace / kinetic quotes
lib/
  store.js          zustand `progress` + smoothed `velocity`
  ease.js           CustomEase curve
  glowTexture.js    shared canvas radial-glow texture (trail, motes, portal)
  constants.js      TRACK_LENGTH, STEP_FREQ, TOTAL_METERS
scripts/
  shoot.mjs         headless capture harness: boots dev server, scrolls, screenshots
```

## Customize

- **Real character:** drop a Blender GLB with a baked `run` clip into
  `public/models/` and follow the swap block in `components/Spark.jsx`
  (`useGLTF` + `useAnimations`, scrub clip time by distance).
- **Feel / cadence:** edit the `trackEase` bezier in `lib/ease.js`.
- **Run length:** `TRACK_LENGTH` in `lib/constants.js` + `.scroll-spacer` height
  in `app/globals.css`.
- **Palette:** the accent (`--accent` in `globals.css`) and the emissive colors in
  `Corridor.jsx` / `Spark.jsx` / `Background.jsx`.
- **Glow strength:** `Bloom` `intensity` / `luminanceThreshold` in `PostFX.jsx`.
- **Speed feel:** the streak gate in `Streaks.jsx` (`speedGate`), the FOV pull /
  shake gains in `Rig.jsx`, and the FX ramps in `PostFX.jsx`.
- **Before/after captures:** `node scripts/shoot.mjs shots/x 0,0.5,0.5v,1` —
  boots the dev server itself; a trailing `v` on a position captures while
  scroll velocity is hot (streaks + aberration firing). Requires Chrome.

## Deploy

`npm run build` emits a fully static `out/`. Drop it behind nginx, an S3/CDN
bucket, GitHub Pages, or any static host — no server runtime needed.

## Notes

Educational starter inspired by publicly observable techniques. Ships no assets
from hirotos.com.
