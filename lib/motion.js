import { trackEase } from './ease';
import { TRACK_LENGTH, STEP_FREQ } from './constants';

/**
 * Shared per-frame motion state — the single owner of every scalar multiple
 * systems need each frame. Written exactly once per frame by <Motion/> (which
 * is the first useFrame subscriber in the tree); everyone else READS it and
 * must never write to it.
 *
 * Data flow:
 *   ScrollController → store.progress (raw scroll input)
 *   Motion → updateMotion(progress, delta) → this object
 *   Rig / Spark / Trail / Ripples / Corridor / Streaks / GridFloor /
 *   Background / PostFX / HUD — read-only consumers.
 */
export const motion = {
  progress: 0,   // raw scroll scalar (mirrored from the store each frame)
  dist: null,    // eased distance 0..1 (null until first frame)
  velocity: 0,   // smoothed scroll speed 0..1
  sparkZ: 0,     // runner world Z
  sparkPhase: 0, // stride phase (radians), tied to distance
  camZ: 0,       // base camera Z: chase gap + dolly, before presentation sway
};

// Camera chase gap behind the runner (world units).
export const CAM_GAP = 6;
// Dolly pulls the camera this much closer at full sprint.
export const DOLLY_AT_SPEED = 0.8;

export function updateMotion(progress, delta) {
  const d = trackEase(progress);

  // smoothed |dd/dt| — first frame is free (no spike on load)
  const raw = motion.dist == null ? 0 : Math.abs(d - motion.dist);
  const vRaw = Math.min(1.5, raw / Math.max(delta, 1e-4));

  motion.progress = progress;
  motion.dist = d;
  motion.velocity = motion.velocity * 0.9 + Math.min(1, vRaw * 2.2) * 0.1;
  motion.sparkZ = -d * TRACK_LENGTH;
  motion.sparkPhase = d * TRACK_LENGTH * STEP_FREQ;
  motion.camZ = motion.sparkZ + CAM_GAP - motion.velocity * DOLLY_AT_SPEED;

  return motion;
}
