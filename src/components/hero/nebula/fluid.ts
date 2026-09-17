import {
  BufferGeometry,
  Float32BufferAttribute,
  GLSL3,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  RawShaderMaterial,
  Scene,
  type Texture,
  Uniform,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";

import type { Splat } from "./motion";
import type { QualityLevel } from "./quality";
import {
  ADVECT,
  CARRY,
  CURL,
  DIVERGENCE,
  FADE,
  GRADIENT,
  HOME,
  PRESSURE,
  SPLAT,
  VERTEX,
  VORTICITY,
} from "./shaders";

// How the gas behaves. Dissipation is per second.
const VELOCITY_DISSIPATION = 1.6;
const HEAT_DISSIPATION = 1.5;
const PRESSURE_FADE = 0.8;
const SWIRL = 12;
// How quickly disturbed clouds settle back (per second).
const HEAL = 0.5;
// The share of the body's speed the gas is carried toward.
const PUSH = 0.45;
// How quickly gas around the body picks that speed up (per second).
const GRAB = 18;
// Size of the body pushing through the gas (a variance, in hero heights²).
const SPLAT_RADIUS = 0.003;
const HEAT_RADIUS = 0.0012;

/** A shader pass with a named set of uniforms. */
export function pass(
  fragmentShader: string,
  uniforms: Record<string, unknown>,
) {
  return new RawShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: VERTEX,
    fragmentShader,
    uniforms: Object.fromEntries(
      Object.entries(uniforms).map(([name, value]) => [
        name,
        new Uniform(value),
      ]),
    ),
    depthTest: false,
    depthWrite: false,
    blending: NoBlending,
  });
}

/** One triangle that covers the screen; each pass lends it a material. */
export class Screen {
  readonly scene = new Scene();
  readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  readonly #mesh: Mesh;

  constructor() {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    );
    this.#mesh = new Mesh(geometry);
    this.#mesh.frustumCulled = false;
    this.scene.add(this.#mesh);
  }

  draw(
    renderer: WebGLRenderer,
    material: RawShaderMaterial,
    target: WebGLRenderTarget | null,
  ) {
    this.#mesh.material = material;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
  }

  /**
   * Compiles every shader up front: in the background where the browser can
   * (KHR_parallel_shader_compile), otherwise all at once before the first
   * frame, rather than in bits while the gas moves.
   */
  async compile(renderer: WebGLRenderer, materials: RawShaderMaterial[]) {
    const scene = new Scene();
    for (const material of materials) {
      const mesh = new Mesh(this.#mesh.geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);
    }
    if (renderer.extensions.has("KHR_parallel_shader_compile")) {
      await renderer.compileAsync(scene, this.camera);
    } else {
      renderer.compile(scene, this.camera);
    }
  }

  dispose() {
    this.#mesh.geometry.dispose();
  }
}

function target(width: number, height: number) {
  return new WebGLRenderTarget(width, height, {
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
    generateMipmaps: false,
  });
}

/** Two targets that take turns: read from one, write to the other, swap. */
class Swap {
  read: WebGLRenderTarget;
  write: WebGLRenderTarget;

  constructor(width: number, height: number) {
    this.read = target(width, height);
    this.write = target(width, height);
  }

  swap() {
    [this.read, this.write] = [this.write, this.read];
  }

  dispose() {
    this.read.dispose();
    this.write.dispose();
  }
}

function createPasses(aspect: number, texel: Vector2) {
  const none = null as Texture | null;
  return {
    splat: pass(SPLAT, {
      uTarget: none,
      uAspect: aspect,
      uPoint: new Vector2(),
      uValue: new Vector3(),
      uRadius: SPLAT_RADIUS,
      uPart: 0,
    }),
    curl: pass(CURL, { uTexel: texel, uVelocity: none }),
    vorticity: pass(VORTICITY, {
      uTexel: texel,
      uVelocity: none,
      uCurl: none,
      uStrength: SWIRL,
      uDt: 0,
    }),
    divergence: pass(DIVERGENCE, { uTexel: texel, uVelocity: none }),
    fade: pass(FADE, { uSource: none, uAmount: PRESSURE_FADE }),
    pressure: pass(PRESSURE, {
      uTexel: texel,
      uPressure: none,
      uDivergence: none,
    }),
    gradient: pass(GRADIENT, {
      uTexel: texel,
      uPressure: none,
      uVelocity: none,
    }),
    advect: pass(ADVECT, {
      uVelocity: none,
      uSource: none,
      uVelocityTexel: texel,
      uDt: 0,
      uDissipation: 0,
    }),
    carry: pass(CARRY, {
      uVelocity: none,
      uCoords: none,
      uVelocityTexel: texel,
      uDt: 0,
      uHeal: HEAL,
    }),
    home: pass(HOME, {}),
  };
}

/** The gas: its velocity, where its clouds came from, and its glow. */
export class Fluid {
  readonly size: { width: number; height: number };
  readonly #renderer: WebGLRenderer;
  readonly #screen: Screen;
  readonly #pressureIterations: number;

  readonly #velocity: Swap;
  readonly #pressure: Swap;
  readonly #coords: Swap;
  readonly #heat: Swap;
  readonly #divergence: WebGLRenderTarget;
  readonly #curl: WebGLRenderTarget;

  readonly #passes: ReturnType<typeof createPasses>;

  constructor(
    renderer: WebGLRenderer,
    screen: Screen,
    aspect: number,
    quality: QualityLevel,
  ) {
    this.#renderer = renderer;
    this.#screen = screen;
    this.#pressureIterations = quality.pressureIterations;

    const height = quality.simHeight;
    const width = Math.max(8, Math.round(height * aspect));
    this.size = { width, height };
    // Clouds are carried on a finer grid than the velocity, for crisper wakes.
    this.#velocity = new Swap(width, height);
    this.#pressure = new Swap(width, height);
    this.#heat = new Swap(width, height);
    this.#coords = new Swap(width * 2, height * 2);
    this.#divergence = target(width, height);
    this.#curl = target(width, height);

    this.#passes = createPasses(aspect, new Vector2(1 / width, 1 / height));
  }

  get materials() {
    return Object.values(this.#passes);
  }

  /** The clouds' carried addresses, for the final picture. */
  get coords() {
    return this.#coords.read.texture;
  }

  /** The glow left behind by the body. */
  get heat() {
    return this.#heat.read.texture;
  }

  /** Calm, undisturbed gas. */
  reset() {
    const { home, fade } = this.#passes;
    this.#screen.draw(this.#renderer, home, this.#coords.read);
    // Fading by zero clears a field.
    fade.uniforms.uAmount.value = 0;
    for (const field of [this.#velocity, this.#pressure, this.#heat]) {
      fade.uniforms.uSource.value = field.read.texture;
      this.#screen.draw(this.#renderer, fade, field.write);
      field.swap();
    }
    fade.uniforms.uAmount.value = PRESSURE_FADE;
  }

  /** Advances the gas by `dt` seconds after applying the given pushes. */
  step(dt: number, splats: Splat[]) {
    const draw = (material: RawShaderMaterial, to: WebGLRenderTarget) =>
      this.#screen.draw(this.#renderer, material, to);
    const p = this.#passes;

    // One frame's share of the way toward the body's speed.
    p.splat.uniforms.uPart.value = 1 - Math.exp(-GRAB * dt);
    for (const splat of splats) {
      p.splat.uniforms.uPoint.value.set(splat.x, splat.y);

      p.splat.uniforms.uRadius.value = SPLAT_RADIUS;
      p.splat.uniforms.uTarget.value = this.#velocity.read.texture;
      p.splat.uniforms.uValue.value.set(splat.dx * PUSH, splat.dy * PUSH, 0);
      draw(p.splat, this.#velocity.write);
      this.#velocity.swap();

      p.splat.uniforms.uRadius.value = HEAT_RADIUS;
      p.splat.uniforms.uTarget.value = this.#heat.read.texture;
      p.splat.uniforms.uValue.value.set(splat.heat, 0, 0);
      draw(p.splat, this.#heat.write);
      this.#heat.swap();
    }

    p.curl.uniforms.uVelocity.value = this.#velocity.read.texture;
    draw(p.curl, this.#curl);

    p.vorticity.uniforms.uVelocity.value = this.#velocity.read.texture;
    p.vorticity.uniforms.uCurl.value = this.#curl.texture;
    p.vorticity.uniforms.uDt.value = dt;
    draw(p.vorticity, this.#velocity.write);
    this.#velocity.swap();

    p.divergence.uniforms.uVelocity.value = this.#velocity.read.texture;
    draw(p.divergence, this.#divergence);

    p.fade.uniforms.uSource.value = this.#pressure.read.texture;
    draw(p.fade, this.#pressure.write);
    this.#pressure.swap();

    p.pressure.uniforms.uDivergence.value = this.#divergence.texture;
    for (let i = 0; i < this.#pressureIterations; i++) {
      p.pressure.uniforms.uPressure.value = this.#pressure.read.texture;
      draw(p.pressure, this.#pressure.write);
      this.#pressure.swap();
    }

    p.gradient.uniforms.uPressure.value = this.#pressure.read.texture;
    p.gradient.uniforms.uVelocity.value = this.#velocity.read.texture;
    draw(p.gradient, this.#velocity.write);
    this.#velocity.swap();

    // Carry the clouds and the glow with the gas, then the gas itself.
    p.carry.uniforms.uVelocity.value = this.#velocity.read.texture;
    p.carry.uniforms.uCoords.value = this.#coords.read.texture;
    p.carry.uniforms.uDt.value = dt;
    draw(p.carry, this.#coords.write);
    this.#coords.swap();

    p.advect.uniforms.uDt.value = dt;
    p.advect.uniforms.uVelocity.value = this.#velocity.read.texture;

    p.advect.uniforms.uSource.value = this.#heat.read.texture;
    p.advect.uniforms.uDissipation.value = HEAT_DISSIPATION;
    draw(p.advect, this.#heat.write);
    this.#heat.swap();

    p.advect.uniforms.uSource.value = this.#velocity.read.texture;
    p.advect.uniforms.uDissipation.value = VELOCITY_DISSIPATION;
    draw(p.advect, this.#velocity.write);
    this.#velocity.swap();
  }

  dispose() {
    for (const field of [
      this.#velocity,
      this.#pressure,
      this.#coords,
      this.#heat,
    ]) {
      field.dispose();
    }
    this.#divergence.dispose();
    this.#curl.dispose();
    for (const material of this.materials) material.dispose();
  }
}
