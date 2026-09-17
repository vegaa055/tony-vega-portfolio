/**
 * How the nebula runs:
 * - "animated": the full effect, with motion and the cursor's wake.
 * - "still": one frame, for visitors who prefer reduced motion.
 * - "off": the CSS stand-in only, for visitors saving data.
 */
export type NebulaMode = "animated" | "still" | "off";

export function nebulaMode({
  reducedMotion,
  saveData,
}: {
  reducedMotion: boolean;
  saveData: boolean;
}): NebulaMode {
  if (saveData) return "off";
  return reducedMotion ? "still" : "animated";
}

// GPU names reported when WebGL runs on the CPU: SwiftShader (Chrome),
// llvmpipe and softpipe (Mesa), and Windows' Basic Render Driver.
const SOFTWARE_RENDERER =
  /swiftshader|llvmpipe|softpipe|software|basic render driver/i;

/**
 * True when WebGL runs on the CPU. The nebula would be slow and heat the
 * machine there, so those visitors keep the CSS stand-in.
 */
export function isSoftwareRenderer(renderer: string) {
  return SOFTWARE_RENDERER.test(renderer);
}

/**
 * The end-to-end tests run in browsers without a GPU. They set this flag to
 * let the nebula run on the CPU anyway.
 */
export function softwareRenderingAllowed() {
  return (
    (globalThis as { __nebulaAllowSoftware?: boolean })
      .__nebulaAllowSoftware === true
  );
}
