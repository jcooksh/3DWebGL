// Shared scene constants so the camera rig and the runner never drift apart.
// TRACK_LENGTH = world units travelled across the full scroll (0 -> 1 progress).
export const TRACK_LENGTH = 220;

// Steps per world unit — stride cadence is tied to DISTANCE, not time, which is
// the whole point of the hirotos.com/TRACK approach.
export const STEP_FREQ = 0.9;

// HUD distance counter target.
export const TOTAL_METERS = 1200;

// THE fog policy — used by scene.fog and every shader that fades to the dark.
export const SCENE_FOG = {
  color: '#050509',
  near: 18,
  far: 90,
};
