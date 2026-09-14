// Generates the two tiling star layers used by <Starfield />.
//
//   npm run stars
//
// Output is seeded, so re-running produces identical files. The two tiles use
// different sizes so their repeats never line up on screen.

import { writeFileSync } from "node:fs";

/** Small, fast, seedable PRNG (mulberry32). Returns floats in [0, 1). */
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Most stars read as white; a few lean hot (blue) or cool (orange).
const TINTS = [
  { color: "#eceef5", share: 0.84 },
  { color: "#b9c6ff", share: 0.1 },
  { color: "#ffd3bd", share: 0.06 },
];

function pickTint(random) {
  let roll = random();
  for (const tint of TINTS) {
    if (roll < tint.share) return tint.color;
    roll -= tint.share;
  }
  return TINTS[0].color;
}

const round = (value, digits) => Number(value.toFixed(digits));

function buildLayer({ size, count, seed, radius, opacity, glowChance }) {
  const random = createRandom(seed);
  const shapes = [];

  for (let i = 0; i < count; i++) {
    const x = random() * size;
    const y = random() * size;
    // Skew toward small, dim stars: most of the sky is faint.
    const brightness = random() ** 2.2;
    const r = radius[0] + brightness * (radius[1] - radius[0]);
    const alpha = opacity[0] + brightness * (opacity[1] - opacity[0]);
    const fill = pickTint(random);
    const hasGlow = brightness > 0.6 && random() < glowChance;
    const extent = hasGlow ? r * 3.5 : r;

    // Draw copies across tile edges so stars aren't clipped at the seams.
    const xs = [x];
    const ys = [y];
    if (x < extent) xs.push(x + size);
    if (x > size - extent) xs.push(x - size);
    if (y < extent) ys.push(y + size);
    if (y > size - extent) ys.push(y - size);

    for (const cx of xs) {
      for (const cy of ys) {
        const at = `cx="${round(cx, 1)}" cy="${round(cy, 1)}"`;
        if (hasGlow) {
          shapes.push(
            `<circle ${at} r="${round(r * 3.5, 2)}" fill="${fill}" opacity="0.07"/>`,
          );
        }
        shapes.push(
          `<circle ${at} r="${round(r, 2)}" fill="${fill}" opacity="${round(alpha, 2)}"/>`,
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${shapes.join("")}</svg>\n`;
}

const layers = {
  "stars-far.svg": {
    size: 1100,
    count: 300,
    seed: 20260914,
    radius: [0.35, 0.9],
    opacity: [0.18, 0.6],
    glowChance: 0,
  },
  "stars-near.svg": {
    size: 1700,
    count: 90,
    seed: 5801977,
    radius: [0.6, 1.6],
    opacity: [0.45, 0.95],
    glowChance: 0.5,
  },
};

for (const [file, options] of Object.entries(layers)) {
  const svg = buildLayer(options);
  writeFileSync(new URL(`../public/${file}`, import.meta.url), svg);
  console.log(`${file}: ${(svg.length / 1024).toFixed(1)} KB`);
}
