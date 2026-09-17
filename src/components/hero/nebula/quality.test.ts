import { describe, expect, it } from "vitest";

import {
  canvasSize,
  initialQuality,
  QUALITY_LEVELS,
  QualityController,
} from "./quality";

const top = QUALITY_LEVELS.length - 1;

describe("initialQuality", () => {
  it("starts desktops at the top level", () => {
    expect(initialQuality({ coarsePointer: false })).toBe(top);
    expect(initialQuality({ coarsePointer: false, deviceMemory: 8 })).toBe(top);
  });

  it("starts touch devices and 4 GB machines in the middle", () => {
    expect(initialQuality({ coarsePointer: true })).toBe(1);
    expect(initialQuality({ coarsePointer: true, deviceMemory: 8 })).toBe(1);
    expect(initialQuality({ coarsePointer: false, deviceMemory: 4 })).toBe(1);
  });

  it("starts low-memory devices at the bottom", () => {
    expect(initialQuality({ coarsePointer: true, deviceMemory: 2 })).toBe(0);
    expect(initialQuality({ coarsePointer: false, deviceMemory: 1 })).toBe(0);
  });
});

describe("canvasSize", () => {
  const megapixels = ({ width, height }: { width: number; height: number }) =>
    (width * height) / 1e6;

  it("draws a laptop hero at three quarters of its CSS size", () => {
    expect(canvasSize(QUALITY_LEVELS[top], 1280, 736)).toEqual({
      width: 960,
      height: 552,
    });
  });

  it("keeps big screens within the level's pixel budget", () => {
    const size = canvasSize(QUALITY_LEVELS[top], 2560, 736);
    expect(megapixels(size)).toBeLessThanOrEqual(0.8 + 0.001);
    expect(size.width / size.height).toBeCloseTo(2560 / 736, 2);
  });

  it("draws a phone hero at full CSS size in the middle level", () => {
    expect(canvasSize(QUALITY_LEVELS[1], 412, 605)).toEqual({
      width: 412,
      height: 605,
    });
  });

  it("gets cheaper at each lower level", () => {
    const sizes = QUALITY_LEVELS.map((level) =>
      megapixels(canvasSize(level, 1024, 736)),
    );
    expect(sizes[0]).toBeLessThan(sizes[1]);
    expect(sizes[1]).toBeLessThan(sizes[2]);
  });
});

describe("QualityController", () => {
  const run = (controller: QualityController, frames: number, ms: number) => {
    let drops = 0;
    for (let i = 0; i < frames; i++) if (controller.record(ms)) drops++;
    return drops;
  };

  it("keeps the level while frames are smooth", () => {
    const controller = new QualityController(top);
    expect(run(controller, 600, 16.7)).toBe(0);
    expect(controller.level).toBe(top);
  });

  it("steps down one level after a while of slow frames", () => {
    const controller = new QualityController(top);
    expect(run(controller, 89, 40)).toBe(0);
    expect(run(controller, 1, 40)).toBe(1);
    expect(controller.level).toBe(top - 1);
  });

  it("waits again after each step, and stops at the bottom", () => {
    const controller = new QualityController(top);
    expect(run(controller, 90, 40)).toBe(1);
    expect(run(controller, 89, 40)).toBe(0);
    expect(run(controller, 1000, 40)).toBe(top - 1);
    expect(controller.level).toBe(0);
  });

  it("ignores pauses such as a hidden tab", () => {
    const controller = new QualityController(top);
    run(controller, 60, 16.7);
    expect(run(controller, 50, 5000)).toBe(0);
    expect(run(controller, 60, 16.7)).toBe(0);
    expect(controller.level).toBe(top);
  });

  it("judges frames against the frame rate it aims for", () => {
    const capped = new QualityController(top, 30);
    expect(run(capped, 600, 33.3)).toBe(0);
    expect(run(capped, 90, 60)).toBe(1);
  });

  it("isn't fooled by a single hiccup", () => {
    const controller = new QualityController(top);
    run(controller, 100, 16.7);
    expect(controller.record(200)).toBe(false);
    expect(run(controller, 100, 16.7)).toBe(0);
  });
});
