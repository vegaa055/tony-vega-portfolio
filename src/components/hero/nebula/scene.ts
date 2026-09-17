import {
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  type Texture,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

import { Fluid, pass, Screen } from "./fluid";
import { drifterAt, type Point, type Splat, splatsAlong } from "./motion";
import {
  canvasSize,
  initialQuality,
  QUALITY_LEVELS,
  QualityController,
} from "./quality";
import { CLOUDS, COMPOSITE } from "./shaders";
import { isSoftwareRenderer, softwareRenderingAllowed } from "./support";

export type NebulaStatus =
  "running" | "still" | "paused" | "unsupported" | "error";

export type NebulaOptions = {
  /** The element the nebula fills. The canvas is added to it. */
  host: HTMLElement;
  canvasClassName: string;
  /** False for a still picture (reduced motion). */
  animate: boolean;
  onStatus: (status: NebulaStatus) => void;
};

export type Nebula = {
  setAnimate(animate: boolean): void;
  dispose(): void;
};

// The cloud texture is drawn in strips, one per frame, to avoid a long pause.
const CLOUD_STRIPS = 8;
// How long the cursor must rest before the drifter takes over (ms).
const DRIFTER_AFTER_MS = 5000;
// The drifter's first pass starts this long after it takes over (s).
const DRIFTER_DELAY_S = 1.5;
// The drifter stirs more gently than a hand on the mouse.
const DRIFTER_STRENGTH = 0.6;
// The moment of drift a still picture shows (s).
const STILL_TIME = 30;

const noop: Nebula = { setAnimate() {}, dispose() {} };

/**
 * Starts the nebula in `host`, or reports "unsupported" when the device can't
 * run it well. Loading continues in the background; `onStatus` reports when
 * the first frame is on screen.
 */
export function createNebula({
  host,
  canvasClassName,
  animate: initialAnimate,
  onStatus,
}: NebulaOptions): Nebula {
  const canvas = document.createElement("canvas");
  canvas.className = canvasClassName;

  const attributes: WebGLContextAttributes = {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    // Don't wake a laptop's discrete GPU for a background effect.
    powerPreference: "low-power",
  };
  // Asked for here rather than by Three.js, which logs an error when a
  // browser has no WebGL 2.
  const gl = canvas.getContext("webgl2", attributes);
  if (!gl) {
    onStatus("unsupported");
    return noop;
  }

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, context: gl, ...attributes });
  } catch {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    onStatus("unsupported");
    return noop;
  }

  // Firefox names the GPU directly; Chrome and Safari need the debug extension.
  let gpu = String(gl.getParameter(gl.RENDERER));
  if (/webkit webgl/i.test(gpu)) {
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      gpu = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
    }
  }
  const floatTargets =
    renderer.extensions.has("EXT_color_buffer_float") ||
    renderer.extensions.has("EXT_color_buffer_half_float");
  if (
    !floatTargets ||
    (isSoftwareRenderer(gpu) && !softwareRenderingAllowed())
  ) {
    renderer.dispose();
    renderer.forceContextLoss();
    onStatus("unsupported");
    return noop;
  }

  renderer.setPixelRatio(1);
  renderer.autoClear = false;
  host.append(canvas);

  const coarsePointer = matchMedia("(pointer: coarse)").matches;
  const noHover = matchMedia("(hover: none)").matches;
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
  // Touch devices draw at most 30 frames a second: the gas moves slowly, and
  // their batteries last longer. Fast displays are held to 60.
  const fps = coarsePointer ? 30 : 60;

  let animate = initialAnimate;
  let disposed = false;
  let ready = false;
  let inView = true;
  let tabVisible = document.visibilityState === "visible";
  let frameId = 0;
  let lastFrame = 0;
  let clock = 0;

  const screen = new Screen();
  const bounds = { width: 1, height: 1 };
  const quality = new QualityController(
    initialQuality({ coarsePointer, deviceMemory }),
    fps,
  );
  const level = () => QUALITY_LEVELS[quality.level];

  // The cloud texture: drawn once, then read by every frame.
  const cloudSize = level().cloudSize;
  const clouds = new WebGLRenderTarget(cloudSize, cloudSize, {
    wrapS: RepeatWrapping,
    wrapT: RepeatWrapping,
    minFilter: LinearMipmapLinearFilter,
    magFilter: LinearFilter,
    generateMipmaps: true,
    depthBuffer: false,
  });
  clouds.scissorTest = true;
  const cloudPass = pass(CLOUDS, { uSeed: 17.3 });

  const composite = pass(COMPOSITE, {
    uClouds: clouds.texture,
    uCoords: null as Texture | null,
    uHeat: null as Texture | null,
    uAspect: 1,
    uTime: 0,
    uCore: new Vector2(0.72, 0.5),
    uCoreSize: 0.3,
  });

  let fluid: Fluid | undefined;

  function resize(): Fluid {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    bounds.width = width;
    bounds.height = height;
    const aspect = width / height;

    const size = canvasSize(level(), width, height);
    renderer.setSize(size.width, size.height, false);

    fluid?.dispose();
    const next = new Fluid(renderer, screen, aspect, level());
    next.reset();
    fluid = next;

    const uniforms = composite.uniforms;
    uniforms.uAspect.value = aspect;
    // Where the core glows depends on the layout, which the stylesheet owns.
    const style = getComputedStyle(host);
    const layout = (name: string, fallback: number) => {
      const value = Number.parseFloat(style.getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };
    uniforms.uCore.value.set(layout("--core-x", 0.75), layout("--core-y", 0.5));
    uniforms.uCoreSize.value = layout("--core-size", 0.24);
    return next;
  }

  function draw(time: number) {
    if (!fluid) return;
    composite.uniforms.uCoords.value = fluid.coords;
    composite.uniforms.uHeat.value = fluid.heat;
    composite.uniforms.uTime.value = time;
    screen.draw(renderer, composite, null);
  }

  // Pointer: the body moving through the gas.
  let pointer: Point | null = null;
  let previousPointer: Point | null = null;
  let lastPointerMove = -Infinity;
  // The drifter, when the pointer is away.
  let drifterClock = -DRIFTER_DELAY_S;
  let previousDrifter: Point | null = null;

  function onPointerMove(event: PointerEvent) {
    const rect = host.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1 - (event.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      pointer = null;
      previousPointer = null;
      return;
    }
    pointer = { x, y };
    lastPointerMove = performance.now();
  }

  function onPointerGone() {
    pointer = null;
    previousPointer = null;
  }

  function collectSplats(now: number, dt: number): Splat[] {
    if (!fluid) return [];
    const aspect = bounds.width / bounds.height;
    const splats: Splat[] = [];

    if (pointer) {
      if (previousPointer) {
        splats.push(
          ...splatsAlong(previousPointer, pointer, dt, aspect, fluid.size),
        );
      }
      previousPointer = pointer;
    }

    const drifting = noHover || now - lastPointerMove > DRIFTER_AFTER_MS;
    if (!drifting) {
      drifterClock = -DRIFTER_DELAY_S;
      previousDrifter = null;
      return splats;
    }
    drifterClock += dt;
    const drifter = drifterAt(drifterClock);
    if (drifter && previousDrifter) {
      splats.push(
        ...splatsAlong(
          previousDrifter,
          drifter,
          dt,
          aspect,
          fluid.size,
          DRIFTER_STRENGTH,
        ),
      );
    }
    previousDrifter = drifter;
    return splats;
  }

  function frame(now: number) {
    frameId = requestAnimationFrame(frame);
    // Skip display frames that come sooner than the target rate allows.
    if (lastFrame && now - lastFrame < 1000 / fps - 4) return;
    const elapsedMs = lastFrame ? now - lastFrame : 1000 / fps;
    lastFrame = now;

    if (quality.record(elapsedMs)) resize();

    // Long gaps (a busy page) shouldn't make the gas jump.
    const dt = Math.min(elapsedMs / 1000, 1 / 30);
    clock += dt;
    fluid?.step(dt, collectSplats(now, dt));
    draw(clock);
  }

  function stopLoop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = 0;
  }

  // Runs, pauses, or shows the still picture, as things change.
  function update() {
    if (disposed || !ready) return;
    if (!animate) {
      stopLoop();
      fluid?.reset();
      draw(STILL_TIME);
      onStatus("still");
      return;
    }
    if (inView && tabVisible) {
      if (!frameId) frameId = requestAnimationFrame(frame);
      onStatus("running");
    } else {
      stopLoop();
      onStatus("paused");
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    if (!ready) return;
    resize();
    if (!animate) draw(STILL_TIME);
  });
  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    update();
  });
  const onVisibility = () => {
    tabVisible = document.visibilityState === "visible";
    update();
  };
  // The stand-in takes over if the GPU resets; the nebula doesn't restart.
  const onContextLost = () => {
    stopLoop();
    ready = false;
    onStatus("error");
  };

  // Compile, draw the clouds strip by strip, then start.
  async function start() {
    const first = resize();
    await screen.compile(renderer, [cloudPass, composite, ...first.materials]);
    if (disposed) return;

    for (let strip = 0; strip < CLOUD_STRIPS; strip++) {
      const top = Math.round((strip * cloudSize) / CLOUD_STRIPS);
      const bottom = Math.round(((strip + 1) * cloudSize) / CLOUD_STRIPS);
      clouds.scissor.set(0, top, cloudSize, bottom - top);
      // Three.js rebuilds the texture's mipmaps after each strip.
      screen.draw(renderer, cloudPass, clouds);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (disposed) return;
    }
    clouds.scissorTest = false;

    ready = true;
    // The first frame is drawn before the status changes, so the canvas
    // never fades in empty.
    draw(animate ? 0 : STILL_TIME);
    update();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    // Scrolling moves the hero under a still pointer; that isn't movement.
    window.addEventListener("scroll", onPointerGone, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerGone);
    window.addEventListener("blur", onPointerGone);
  }

  resizeObserver.observe(host);
  viewObserver.observe(host);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);

  start().catch(() => {
    if (!disposed) onStatus("error");
  });

  return {
    setAnimate(value) {
      animate = value;
      update();
    },
    dispose() {
      disposed = true;
      stopLoop();
      resizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onPointerGone);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerGone,
      );
      window.removeEventListener("blur", onPointerGone);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      fluid?.dispose();
      clouds.dispose();
      cloudPass.dispose();
      composite.dispose();
      screen.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
