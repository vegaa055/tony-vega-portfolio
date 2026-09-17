import { afterEach, describe, expect, it } from "vitest";

import {
  isSoftwareRenderer,
  nebulaMode,
  softwareRenderingAllowed,
} from "./support";

describe("nebulaMode", () => {
  it("animates by default", () => {
    expect(nebulaMode({ reducedMotion: false, saveData: false })).toBe(
      "animated",
    );
  });

  it("shows a still frame when motion is reduced", () => {
    expect(nebulaMode({ reducedMotion: true, saveData: false })).toBe("still");
  });

  it("stays off when saving data, even with reduced motion", () => {
    expect(nebulaMode({ reducedMotion: false, saveData: true })).toBe("off");
    expect(nebulaMode({ reducedMotion: true, saveData: true })).toBe("off");
  });
});

describe("isSoftwareRenderer", () => {
  it.each([
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
    "Google SwiftShader",
    "llvmpipe (LLVM 15.0.7, 256 bits)",
    "softpipe",
    "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)",
  ])("recognizes %s", (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(true);
  });

  it.each([
    "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
    "Apple M2",
    "Adreno (TM) 730",
    "Mali-G78",
    "WebKit WebGL",
  ])("accepts %s", (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(false);
  });
});

describe("softwareRenderingAllowed", () => {
  const scope = globalThis as { __nebulaAllowSoftware?: boolean };

  afterEach(() => {
    delete scope.__nebulaAllowSoftware;
  });

  it("is off unless the tests turn it on", () => {
    expect(softwareRenderingAllowed()).toBe(false);
    scope.__nebulaAllowSoftware = true;
    expect(softwareRenderingAllowed()).toBe(true);
  });
});
