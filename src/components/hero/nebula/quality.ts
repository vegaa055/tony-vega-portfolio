export type QualityLevel = {
  /** The most canvas pixels drawn, in megapixels. */
  maxPixels: number;
  /** The most canvas pixels per CSS pixel. The clouds are soft, so below 1 works. */
  maxScale: number;
  /** Height of the gas simulation grid, in cells. */
  simHeight: number;
  /** Pressure solver passes per frame: more keeps the swirls tighter. */
  pressureIterations: number;
  /** Size of the pre-drawn cloud texture, in pixels. */
  cloudSize: number;
};

/** From cheapest to richest. */
export const QUALITY_LEVELS: readonly QualityLevel[] = [
  {
    maxPixels: 0.15,
    maxScale: 0.75,
    simHeight: 64,
    pressureIterations: 8,
    cloudSize: 512,
  },
  {
    maxPixels: 0.3,
    maxScale: 1,
    simHeight: 96,
    pressureIterations: 12,
    cloudSize: 1024,
  },
  {
    maxPixels: 0.8,
    maxScale: 0.75,
    simHeight: 128,
    pressureIterations: 18,
    cloudSize: 1024,
  },
];

/** The canvas size for a hero of `width` by `height` CSS pixels. */
export function canvasSize(level: QualityLevel, width: number, height: number) {
  const scale = Math.min(
    level.maxScale,
    Math.sqrt((level.maxPixels * 1e6) / (width * height)),
  );
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * The level to start at. Phones and tablets start in the middle, and
 * low-memory devices at the bottom.
 */
export function initialQuality({
  coarsePointer,
  deviceMemory,
}: {
  coarsePointer: boolean;
  /** navigator.deviceMemory in GB, where the browser reports it. */
  deviceMemory?: number;
}) {
  if (deviceMemory !== undefined && deviceMemory <= 2) return 0;
  if (coarsePointer || (deviceMemory !== undefined && deviceMemory <= 4)) {
    return 1;
  }
  return QUALITY_LEVELS.length - 1;
}

// Frames this much slower than the target, on average, mean the device is
// struggling (24 ms at 60 frames a second).
const SLOW_FACTOR = 1.45;
// One frame counts as at most this many target frames, so a single hiccup
// (garbage collection, say) can't drag the average past the limit.
const MAX_SAMPLE_FACTOR = 2.4;
// Gaps longer than this are pauses (a background tab), not slow frames.
const PAUSE_MS = 250;
// Frames to watch before judging, and again after each change.
const SETTLE_FRAMES = 90;

/**
 * Lowers the quality level when frames run slow for a while. It never raises
 * it again, so the picture doesn't flicker between levels.
 */
export class QualityController {
  #level: number;
  #average = 0;
  #frames = 0;
  readonly #targetMs: number;

  /** `fps` is the frame rate the nebula aims for. */
  constructor(level: number, fps = 60) {
    this.#level = level;
    this.#targetMs = 1000 / fps;
  }

  get level() {
    return this.#level;
  }

  /** Records the time since the last frame. Returns true if the level dropped. */
  record(frameMs: number) {
    if (frameMs <= 0 || frameMs > PAUSE_MS) return false;

    this.#frames += 1;
    const sample = Math.min(frameMs, this.#targetMs * MAX_SAMPLE_FACTOR);
    this.#average =
      this.#frames === 1 ? sample : this.#average * 0.95 + sample * 0.05;

    if (
      this.#frames >= SETTLE_FRAMES &&
      this.#average > this.#targetMs * SLOW_FACTOR &&
      this.#level > 0
    ) {
      this.#level -= 1;
      this.#frames = 0;
      return true;
    }
    return false;
  }
}
