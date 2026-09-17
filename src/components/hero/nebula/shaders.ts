/**
 * GLSL for the nebula. Every pass draws one full-screen triangle, so they all
 * share the vertex shader.
 *
 * The gas simulation follows Jos Stam's "Stable Fluids" as adapted for the GPU
 * in GPU Gems (chapter 38): push the gas, keep its swirls alive (vorticity
 * confinement), make it incompressible (a pressure solve), then move
 * everything along with it (advection). Velocities are in simulation texels
 * per second.
 */

const HEADER = /* glsl */ `
precision highp float;
precision highp sampler2D;
`;

export const VERTEX = /* glsl */ `
${HEADER}
in vec3 position;
out vec2 vUv;

void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Neighbors in the simulation grid, shared by several passes.
const NEIGHBORS = /* glsl */ `
uniform vec2 uTexel;
in vec2 vUv;
out vec4 outColor;

vec2 left() { return vUv - vec2(uTexel.x, 0.0); }
vec2 right() { return vUv + vec2(uTexel.x, 0.0); }
vec2 top() { return vUv + vec2(0.0, uTexel.y); }
vec2 bottom() { return vUv - vec2(0.0, uTexel.y); }
`;

/**
 * Draws the moving body into a field: gas near it is carried toward the
 * body's own velocity (or glow), rather than shoved harder on every frame.
 * `uPart` is how much of the way there one frame goes, which keeps the effect
 * the same whether the device draws 30 or 144 frames a second.
 */
export const SPLAT = /* glsl */ `
${HEADER}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uPoint;
uniform vec3 uValue;
uniform float uRadius;
uniform float uPart;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 offset = vUv - uPoint;
  offset.x *= uAspect;
  float reach = exp(-dot(offset, offset) / uRadius) * uPart;
  outColor = vec4(mix(texture(uTarget, vUv).xyz, uValue, reach), 1.0);
}
`;

/** How much the gas spins at each cell. */
export const CURL = /* glsl */ `
${HEADER}
uniform sampler2D uVelocity;
${NEIGHBORS}

void main() {
  float l = texture(uVelocity, left()).y;
  float r = texture(uVelocity, right()).y;
  float t = texture(uVelocity, top()).x;
  float b = texture(uVelocity, bottom()).x;
  outColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}
`;

/** Feeds spin back into the gas so small swirls don't fade out at once. */
export const VORTICITY = /* glsl */ `
${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uStrength;
uniform float uDt;
${NEIGHBORS}

void main() {
  float l = texture(uCurl, left()).x;
  float r = texture(uCurl, right()).x;
  float t = texture(uCurl, top()).x;
  float b = texture(uCurl, bottom()).x;
  float c = texture(uCurl, vUv).x;

  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 0.0001;
  force *= uStrength * c;
  force.y *= -1.0;

  vec2 velocity = texture(uVelocity, vUv).xy + force * uDt;
  outColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
}
`;

/** How much gas flows out of each cell. The hero's edges act as walls. */
export const DIVERGENCE = /* glsl */ `
${HEADER}
uniform sampler2D uVelocity;
${NEIGHBORS}

void main() {
  vec2 c = texture(uVelocity, vUv).xy;
  float l = left().x < 0.0 ? -c.x : texture(uVelocity, left()).x;
  float r = right().x > 1.0 ? -c.x : texture(uVelocity, right()).x;
  float t = top().y > 1.0 ? -c.y : texture(uVelocity, top()).y;
  float b = bottom().y < 0.0 ? -c.y : texture(uVelocity, bottom()).y;
  outColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}
`;

/** Scales a field; used to let the last frame's pressure fade. */
export const FADE = /* glsl */ `
${HEADER}
uniform sampler2D uSource;
uniform float uAmount;
in vec2 vUv;
out vec4 outColor;

void main() {
  outColor = uAmount * texture(uSource, vUv);
}
`;

/** One step of solving for the pressure that cancels the divergence. */
export const PRESSURE = /* glsl */ `
${HEADER}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
${NEIGHBORS}

void main() {
  float l = texture(uPressure, left()).x;
  float r = texture(uPressure, right()).x;
  float t = texture(uPressure, top()).x;
  float b = texture(uPressure, bottom()).x;
  float divergence = texture(uDivergence, vUv).x;
  outColor = vec4(0.25 * (l + r + t + b - divergence), 0.0, 0.0, 1.0);
}
`;

/** Removes the pressure gradient, leaving gas that neither piles up nor thins. */
export const GRADIENT = /* glsl */ `
${HEADER}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
${NEIGHBORS}

void main() {
  float l = texture(uPressure, left()).x;
  float r = texture(uPressure, right()).x;
  float t = texture(uPressure, top()).x;
  float b = texture(uPressure, bottom()).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(r - l, t - b);
  outColor = vec4(velocity, 0.0, 1.0);
}
`;

/**
 * Moves a field along with the gas by looking back along the flow, and lets
 * it fade (`uDissipation` per second).
 */
export const ADVECT = /* glsl */ `
${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uVelocityTexel;
uniform float uDt;
uniform float uDissipation;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 from = vUv - uDt * texture(uVelocity, vUv).xy * uVelocityTexel;
  outColor = texture(uSource, from) / (1.0 + uDissipation * uDt);
}
`;

/**
 * The heart of the effect. Each cell stores where its gas came from, in
 * texture space. The gas carries those addresses along, so the clouds drawn
 * from them get dragged and twisted; meanwhile every address drifts back
 * home (`uHeal` per second), and the clouds slowly settle.
 */
export const CARRY = /* glsl */ `
${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uCoords;
uniform vec2 uVelocityTexel;
uniform float uDt;
uniform float uHeal;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 from = vUv - uDt * texture(uVelocity, vUv).xy * uVelocityTexel;
  vec2 carried = texture(uCoords, from).xy;
  vec2 healed = mix(carried, vUv, 1.0 - exp(-uHeal * uDt));
  outColor = vec4(healed, 0.0, 1.0);
}
`;

/** Every address at home: undisturbed gas. */
export const HOME = /* glsl */ `
${HEADER}
in vec2 vUv;
out vec4 outColor;

void main() {
  outColor = vec4(vUv, 0.0, 1.0);
}
`;

/**
 * Draws the cloud texture once, at startup. It tiles, so the clouds can
 * drift forever. Channels: red is glowing gas, green is dust, blue is fine
 * strands, alpha is a slow variation used for color.
 *
 * The noise repeats every `period` cells, which is what makes it tile.
 */
export const CLOUDS = /* glsl */ `
${HEADER}
uniform float uSeed;
in vec2 vUv;
out vec4 outColor;

vec2 gradient(vec2 cell) {
  cell = vec2(dot(cell, vec2(127.1, 311.7)), dot(cell, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(cell + uSeed) * 43758.5453);
}

// Gradient noise that repeats every period cells. Roughly -0.7 to 0.7.
float noise(vec2 p, float period) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(gradient(mod(i, period)), f);
  float b = dot(gradient(mod(i + vec2(1.0, 0.0), period)), f - vec2(1.0, 0.0));
  float c = dot(gradient(mod(i + vec2(0.0, 1.0), period)), f - vec2(0.0, 1.0));
  float d = dot(gradient(mod(i + vec2(1.0, 1.0), period)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Layers of noise, each twice as fine. Every layer still repeats across the
// texture, and a different offset per layer hides the shared grid.
float fbm(vec2 uv, float period, int octaves) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int k = 0; k < octaves; k++) {
    vec2 offset = vec2(float(k) * 7.31, float(k) * 3.17);
    sum += amplitude * noise(uv * period + offset, period);
    period *= 2.0;
    amplitude *= 0.5;
  }
  return sum;
}

float ridges(vec2 uv, float period, int octaves) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int k = 0; k < octaves; k++) {
    vec2 offset = vec2(float(k) * 5.13, float(k) * 9.71);
    float n = 1.0 - abs(noise(uv * period + offset, period) * 1.6);
    sum += amplitude * n * n;
    period *= 2.0;
    amplitude *= 0.5;
  }
  return sum;
}

void main() {
  vec2 uv = vUv;

  // Domain warping (after Inigo Quilez): noise that bends the input of more
  // noise, which turns blobs into wisps. Offsets are whole texture widths, so
  // tiling survives.
  vec2 warp = vec2(fbm(uv + 0.13, 3.0, 3), fbm(uv + 0.61, 3.0, 3));
  vec2 bend = vec2(
    fbm(uv + 0.7 * warp + 0.29, 3.0, 3),
    fbm(uv + 0.7 * warp + 0.83, 3.0, 3)
  );

  float gas = fbm(uv + 0.55 * bend, 4.0, 6);
  gas = smoothstep(-0.3, 0.45, gas);

  float dust = fbm(uv + 0.35 * warp + 0.47, 5.0, 5);
  dust = smoothstep(0.02, 0.3, dust) * smoothstep(0.35, 0.75, gas + 0.15);

  float strands = ridges(uv + 0.45 * bend + 0.11, 6.0, 4);
  strands = smoothstep(0.55, 0.95, strands);

  float tint = smoothstep(-0.35, 0.35, fbm(uv + 0.77, 2.0, 2));

  outColor = vec4(gas, dust, strands, tint);
}
`;

/**
 * The picture: clouds read through the carried addresses, colored in the
 * site's palette, brightest around a warm core, with dust lanes and a glow
 * where the gas was just disturbed. The output is premultiplied, so thin gas
 * lets the page's starfield show through.
 */
export const COMPOSITE = /* glsl */ `
${HEADER}
uniform sampler2D uClouds;
uniform sampler2D uCoords;
uniform sampler2D uHeat;
uniform float uAspect;
uniform float uTime;
uniform vec2 uCore;
uniform float uCoreSize;
in vec2 vUv;
out vec4 outColor;

// The site's colors (see globals.css): periwinkle gas and a coral core.
const vec3 INDIGO = vec3(0.05, 0.08, 0.26);
const vec3 BLUE = vec3(0.21, 0.36, 0.95);
const vec3 PALE = vec3(0.62, 0.72, 1.0);
const vec3 CORAL = vec3(1.0, 0.416, 0.302);
const vec3 PEACH = vec3(1.0, 0.64, 0.52);
const vec3 HOT = vec3(1.0, 0.94, 0.90);

void main() {
  vec2 coords = texture(uCoords, vUv).xy;
  // How far the gas here has been carried, in hero heights.
  vec2 shift = (coords - vUv) * vec2(uAspect, 1.0);
  vec2 world = coords * vec2(uAspect, 1.0);

  // Two cloud layers drift at different speeds. The nearer one is carried
  // further by the gas, which gives the wake some depth.
  vec2 farUv = world * 0.36 + vec2(0.0031, 0.0009) * uTime;
  vec2 nearUv = (world + shift * 0.9) * 0.58 + vec2(0.31, 0.57)
    + vec2(-0.0052, 0.0014) * uTime;
  vec4 far = texture(uClouds, farUv);
  vec4 near = texture(uClouds, nearUv);
  float heat = texture(uHeat, vUv).x;

  // Composition: brightest around the core, fading toward the edges.
  vec2 fromCore = (vUv - uCore) * vec2(uAspect, 1.0);
  float distance2 = dot(fromCore, fromCore);
  float core = exp(-distance2 / (uCoreSize * uCoreSize));
  float halo = exp(-distance2 / (uCoreSize * uCoreSize * 6.0));

  float gas = (far.r * 0.5 + near.r * 0.8) * (0.18 + 0.82 * halo);
  float dust = max(far.g * 0.6, near.g);
  float strands = near.b * halo;
  float tint = mix(far.a, near.a, 0.5);

  vec3 cool = mix(INDIGO, BLUE, smoothstep(0.1, 0.75, gas));
  cool = mix(cool, PALE, smoothstep(0.7, 1.2, gas) * 0.45);
  vec3 color = cool * gas * (0.8 + 0.4 * tint);
  color += PALE * strands * 0.22;

  // Warm light from the core.
  float warm = core * smoothstep(0.15, 0.8, gas);
  color = mix(color, CORAL * gas * 1.35, warm * 0.85);
  color += PEACH * warm * warm * gas * 0.55;
  color += HOT * pow(warm * gas, 2.5) * 0.7;

  // Dust lanes block the light behind them.
  color *= 1.0 - dust * (0.7 + 0.25 * core);

  // Gas that something just passed through glows for a moment. The glow is
  // capped, so circling one spot doesn't burn it white.
  color += mix(PALE, PEACH, core) * min(heat, 0.5) * (0.08 + gas) * 0.3;

  color = min(color, vec3(1.0));
  float alpha = min(max(color.r, max(color.g, color.b)) * 1.15, 1.0);
  outColor = vec4(color, alpha);
}
`;
