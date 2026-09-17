import { describe, expect, it } from "vitest";

import { DRIFTER, drifterAt, splatsAlong } from "./motion";

const sim = { width: 200, height: 100 };

describe("splatsAlong", () => {
  it("does nothing when the body hasn't moved", () => {
    expect(
      splatsAlong({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, 1 / 60, 2, sim),
    ).toEqual([]);
  });

  it("pushes in the direction of movement, ending where the body is", () => {
    const splats = splatsAlong(
      { x: 0.5, y: 0.5 },
      { x: 0.51, y: 0.5 },
      1 / 60,
      2,
      sim,
    );
    expect(splats).toHaveLength(1);
    const [splat] = splats;
    expect(splat.x).toBeCloseTo(0.51);
    expect(splat.y).toBeCloseTo(0.5);
    expect(splat.dx).toBeGreaterThan(0);
    expect(splat.dy).toBeCloseTo(0);
  });

  it("spaces pushes along a long move so the wake has no gaps", () => {
    const splats = splatsAlong(
      { x: 0.1, y: 0.2 },
      { x: 0.3, y: 0.2 },
      1 / 60,
      2,
      sim,
    );
    // 0.2 of the width is 0.4 hero heights, at one push per 0.035.
    expect(splats).toHaveLength(10);
    expect(splats.at(-1)?.x).toBeCloseTo(0.3);
    const gaps = splats.slice(1).map((s, i) => s.x - splats[i].x);
    for (const gap of gaps) expect(gap).toBeCloseTo(0.02);
  });

  it("caps the speed, so a jump doesn't blow the gas apart", () => {
    const slow = splatsAlong(
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.53 },
      0.1,
      2,
      sim,
    );
    const teleport = splatsAlong(
      { x: 0.5, y: 0.1 },
      { x: 0.5, y: 0.9 },
      1 / 60,
      2,
      sim,
    );
    // 0.3 hero heights a second, in texels: 0.3 * 100.
    expect(slow[0].dy).toBeCloseTo(30);
    const total = Math.hypot(teleport[0].dx, teleport[0].dy);
    // At most 5 hero heights a second, shared across the pushes.
    expect(total).toBeCloseTo((5 * 100) / Math.sqrt(teleport.length));
  });

  it("scales the push and the glow by strength", () => {
    const full = splatsAlong(
      { x: 0.2, y: 0.5 },
      { x: 0.21, y: 0.5 },
      0.1,
      2,
      sim,
    );
    const gentle = splatsAlong(
      { x: 0.2, y: 0.5 },
      { x: 0.21, y: 0.5 },
      0.1,
      2,
      sim,
      0.5,
    );
    expect(gentle[0].dx).toBeCloseTo(full[0].dx / 2);
    expect(gentle[0].heat).toBeCloseTo(full[0].heat / 2);
  });

  it("makes faster moves glow more, up to a limit", () => {
    const heatAt = (dt: number) =>
      splatsAlong({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.52 }, dt, 1, sim)[0].heat;
    expect(heatAt(0.1)).toBeLessThan(heatAt(0.02));
    expect(heatAt(0.001)).toBeLessThanOrEqual(1);
  });
});

describe("drifterAt", () => {
  it("waits before the start and rests between passes", () => {
    expect(drifterAt(-1)).toBeNull();
    expect(drifterAt(DRIFTER.duration + 0.5)).toBeNull();
    expect(drifterAt(DRIFTER.period - 0.1)).toBeNull();
  });

  it("crosses the whole hero, in alternating directions", () => {
    const first = [drifterAt(0), drifterAt(DRIFTER.duration)];
    const second = [
      drifterAt(DRIFTER.period),
      drifterAt(DRIFTER.period + DRIFTER.duration),
    ];
    expect(first[0]?.x).toBeLessThan(0);
    expect(first[1]?.x).toBeGreaterThan(1);
    expect(second[0]?.x).toBeGreaterThan(1);
    expect(second[1]?.x).toBeLessThan(0);
  });

  it("moves smoothly and stays within the hero's height", () => {
    let previous = drifterAt(0);
    for (let t = 0.02; t <= DRIFTER.duration; t += 0.02) {
      const point = drifterAt(t);
      expect(point).not.toBeNull();
      if (!point || !previous) continue;
      expect(Math.abs(point.x - previous.x)).toBeLessThan(0.01);
      expect(Math.abs(point.y - previous.y)).toBeLessThan(0.01);
      expect(point.y).toBeGreaterThan(0.05);
      expect(point.y).toBeLessThan(0.95);
      previous = point;
    }
  });

  it("takes a different line on each pass", () => {
    const heights = [0, 2, 4].map(
      (pass) => drifterAt(pass * DRIFTER.period + DRIFTER.duration / 2)?.y,
    );
    expect(new Set(heights).size).toBe(3);
  });
});
