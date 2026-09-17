/**
 * The moving "body" that stirs the gas: the cursor, or, when there isn't one,
 * an unseen drifter. Positions are in the hero's texture space: x from 0 at
 * the left to 1 at the right, y from 0 at the bottom to 1 at the top.
 */
export type Point = { x: number; y: number };

/** A push on the gas at one spot, in simulation texels per second. */
export type Splat = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  /** How much the gas glows there afterwards, from 0 to 1. */
  heat: number;
};

// Pushes are spaced about this far apart along a path (in hero heights), so a
// fast move leaves an unbroken wake.
const SPLAT_SPACING = 0.035;
const MAX_SPLATS = 10;
// The fastest the body counts as moving: the hero's height in 0.2 seconds.
const MAX_SPEED = 5;
// Speed (hero heights per second) at which the glow is strongest.
const FULL_HEAT_SPEED = 2.5;

/**
 * The pushes for a body that moved from `from` to `to` during `dt` seconds.
 * `aspect` is the hero's width over its height; `simSize` is the simulation
 * grid, so the push comes out in its texels. `strength` scales the push and
 * the glow.
 */
export function splatsAlong(
  from: Point,
  to: Point,
  dt: number,
  aspect: number,
  simSize: { width: number; height: number },
  strength = 1,
): Splat[] {
  // Measure on screen: x in hero heights too.
  const moveX = (to.x - from.x) * aspect;
  const moveY = to.y - from.y;
  const distance = Math.hypot(moveX, moveY);
  if (distance < 1e-5 || dt <= 0) return [];

  const speed = Math.min(distance / dt, MAX_SPEED);
  const scale = (speed / (distance / dt)) * strength;
  // Velocity in texture units per second, then in simulation texels.
  const vx = ((to.x - from.x) / dt) * scale * simSize.width;
  const vy = ((to.y - from.y) / dt) * scale * simSize.height;
  const heat = Math.min(speed / FULL_HEAT_SPEED, 1) * strength;

  const count = Math.min(
    MAX_SPLATS,
    Math.max(1, Math.ceil(distance / SPLAT_SPACING)),
  );
  const splats: Splat[] = [];
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    splats.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      // Overlapping pushes add up, so each carries a share.
      dx: vx / Math.sqrt(count),
      dy: vy / Math.sqrt(count),
      heat: heat / Math.sqrt(count),
    });
  }
  return splats;
}

/** A small repeatable pseudo-random number in [0, 1). */
function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export type DrifterOptions = {
  /** Seconds from the start of one pass to the next. */
  period: number;
  /** Seconds a pass takes; the rest of the period is quiet. */
  duration: number;
};

export const DRIFTER: DrifterOptions = { period: 13, duration: 6 };

/**
 * Where the unseen drifter is `t` seconds after it starts, or null while it
 * rests between passes. Each pass crosses the hero on a gentle arc, in
 * alternating directions and at a different height each time.
 */
export function drifterAt(
  t: number,
  { period, duration }: DrifterOptions = DRIFTER,
): Point | null {
  if (t < 0) return null;
  const pass = Math.floor(t / period);
  const progress = (t - pass * period) / duration;
  if (progress > 1) return null;

  const s = smoothstep(progress);
  const rightward = pass % 2 === 0;
  // Start and end just outside the hero, so the body sweeps all the way across.
  const x = rightward ? -0.08 + s * 1.16 : 1.08 - s * 1.16;
  const startY = 0.25 + hash(pass) * 0.5;
  const endY = 0.25 + hash(pass + 0.5) * 0.5;
  const bow = (hash(pass + 0.25) - 0.5) * 0.3;
  const y = startY + (endY - startY) * s + bow * Math.sin(Math.PI * s);
  return { x, y };
}
