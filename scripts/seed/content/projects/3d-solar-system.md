An interactive model of the solar system that runs in the browser. Two things set it apart: the motion comes from a real gravity simulation, and every surface you see is drawn by shader code. There isn't a single image texture in the project. The Sun, the planets, their moons, the rings, and the sky are all generated from mathematical noise on the GPU.

## Real physics, not rails

Most solar system demos move planets along fixed ellipses. Here, all 20 bodies pull on each other in a direct N-body simulation. The orbit lines you see are recalculated from the simulated motion, so they respond when bodies perturb each other.

- **Units** are astronomical units, days, and solar masses. In those units, the gravitational constant is the square of the Gaussian gravitational constant.
- **The integrator** is velocity Verlet at a fixed step of 0.05 days. It's *symplectic*, which means the energy error oscillates within a bound instead of growing. Over a simulated 20 years, the drift stays around 1.5 × 10⁻⁸.
- **Starting positions** come from JPL's orbital elements for the major planets at the J2000 epoch, converted to positions and velocities by solving Kepler's equation.
- **Planets orbit shared centers of mass.** Pluto and Charon visibly swing around a point in empty space, and the Sun wobbles as Jupiter tugs on it.
- **Moons start in their planet's equatorial plane.** That's why Uranus's moons orbit almost perpendicular to everything else: Uranus is tipped 97.8°, and its moons came along. Triton starts out retrograde, as it is in reality.

### Checked against reality

Numbers read from the running simulation, compared with published values:

| | Simulation | Actual |
| --- | --- | --- |
| Mars orbital period | 686.99 days | 686.98 days |
| Mars eccentricity | 0.0934 | 0.0934 |
| Moon sidereal period | 27.322 days | 27.3217 days |
| Io orbital speed | 17.40 km/s | 17.33 km/s |
| Neptune orbital speed | 5.47 km/s | 5.43 km/s |
| Triton's orbit | retrograde | retrograde |

## Every surface is math

The Sun is a single fragment shader that layers several effects:

- **Granulation:** cellular noise dragged along by a slow flow field, so convection cells stretch, merge, and dissolve.
- **Sunspots:** confined to two latitude bands, following the real "butterfly diagram." Each one has a dark core inside a filament-like ring.
- **Flares** that briefly brighten a region and physically lift the surface in the vertex shader.
- **Differential rotation**, so the equator laps the poles.
- **Limb darkening**, using the classic formula I(μ) = 0.32 + 0.68·μ^0.55.

Planets and moons use one of nine surface routines, chosen at compile time: cratered, Earth-like, Martian, Venusian, gas giant, ice giant, icy, volcanic, and hazy. Earth gets continents, biomes, snow lines, a reflective ocean, weather bands, and city lights that only appear on the night side. Jupiter's cloud bands drift at different speeds around a swirling Great Red Spot, and Saturn has its north polar hexagon.

Saturn's rings are procedural too, down to the Cassini division and the Encke and Keeler gaps. The planet casts a shadow on the rings, and the rings cast a detailed shadow back onto the planet. That works because the planet shader samples the same ring density function the rings use.

## 60,000 asteroids in one draw call

The asteroid belt couldn't join the N-body simulation: adding 10,000 asteroids would mean about 50 million gravity calculations per step. It doesn't need to, either. Jupiter alone is about 630,000 times heavier than the entire main belt, so asteroids feel gravity but don't meaningfully exert it.

So each asteroid's orbit is stored once, and every frame the GPU places each asteroid by solving Kepler's equation right in the vertex shader:

```glsl
// Newton-Raphson on Kepler's equation. Eccentricities here stay under 0.4,
// so the sine-shifted start converges in three iterations; four is headroom.
float E = M + e * sin(M);
for (int i = 0; i < 4; i++) {
  E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
}
```

With 60,000 asteroids, including Jupiter's Trojan clouds, the belt adds about a fifth of a millisecond per frame, even when flying through it. Fixed orbits would be wrong only where asteroids fall into resonance with Jupiter, and those regions are the Kirkwood gaps, which are carved out as empty. The approximation holds everywhere asteroids actually are.

## Honest about scale

At true scale, the planets would be invisible specks. By default, planets are drawn 320 times their real size and the Sun 26 times. Distances and physics are never scaled, only the drawn sizes, and a "true scale" option sets everything back to 1×.
