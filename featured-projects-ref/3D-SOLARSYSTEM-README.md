# 3D Solar System

An interactive solar system in the browser: real gravitational mechanics driving
the motion, and custom GLSL doing every surface. No image textures are used
anywhere — the Sun, the planets, the moons, the rings and the sky are all
generated from mathematical noise on the GPU.

## Running it

The page uses ES modules, which browsers refuse to load over `file://`, so it
needs to be served. Any static server works:

```bash
python -m http.server 8123
```

Then open <http://localhost:8123>. Or, with Node:

```bash
npx --yes serve -l 8123 .
```

Three.js r160 is vendored under `vendor/`, so there is nothing to install and it
runs offline.

## Controls

| Input | Action |
| --- | --- |
| drag | orbit the camera |
| scroll / pinch | zoom (exponential, so it stays usable from moon-surface to Pluto-aphelion range) |
| right-drag, middle-drag, or shift-drag | pan |
| click a body or a label | select and follow it |
| `space` | pause |
| `H` | hide the interface |
| `O` / `T` / `L` | orbits / trails / labels |
| `Esc` | deselect and release the camera |

## The physics

This is a direct N-body simulation. Every one of the 20 bodies pulls on every
other one — nothing is on a fixed rail, and the ellipses you see drawn are
recomputed from the integrated state, so they visibly respond to perturbation.

- **Units.** AU, days, solar masses. In those units `G` is the square of the
  Gaussian gravitational constant, `k² = 2.9591220828559115e-4`.
- **Integrator.** Velocity Verlet at a fixed 0.05 day step (subdivided further
  at low time rates). It is symplectic, so energy error oscillates within a
  bound instead of accumulating — the panel's *energy drift* readout shows this
  directly. Over a 20-year run it sits around 1.5 × 10⁻⁸ and does not grow.
- **Initial conditions.** Planet elements are the JPL "approximate positions of
  the major planets" set at J2000, converted to state vectors by solving
  Kepler's equation. To start at another date the mean anomaly is advanced at
  the Keplerian mean motion, which is accurate to a few arcminutes over a
  century; from there the integrator takes over and the real mutual
  perturbations shape the motion.
- **Barycentres.** Planet elements describe the planet–satellite barycentre, so
  each planet is offset from it against the weighted sum of its moons. For
  Pluto and Charon that offset falls outside Pluto's surface, and you can watch
  the pair swing around a point in empty space.
- **Frames.** Regular satellites are seeded in their parent's equatorial plane
  rather than the ecliptic, which is where they actually live. This is why the
  Uranian moons orbit almost perpendicular to everything else — Uranus is tipped
  97.8°, and its satellites came along. Triton is seeded retrograde.
- **Softening.** A Plummer softening length of 1e-6 AU (≈150 km) prevents
  singularities. It is far smaller than the smallest body in the model, so it
  never touches a real orbit.

The system is shifted into its barycentric frame at startup, so the Sun visibly
wobbles around the barycentre as Jupiter swings it — zoom in on the Sun with
trails on and you can see it.

### Verified against reality

Live readouts from the running simulation, versus published values:

| | model | actual |
| --- | --- | --- |
| Mars orbital period | 686.99 d | 686.98 d |
| Mars eccentricity | 0.0934 | 0.0934 |
| Moon sidereal period | 27.322 d | 27.3217 d |
| Io orbital speed | 17.40 km/s | 17.33 km/s |
| Neptune orbital speed | 5.47 km/s | 5.43 km/s |
| Triton | retrograde | retrograde |

## The shaders

### The Sun

The photosphere is a single fragment shader combining:

- **Granulation** — cellular (Worley) noise whose sample point is dragged by a
  slow fbm flow field, so convection cells stretch, merge and dissolve rather
  than sitting still. `F2 − F1` lights the cell interiors and leaves the
  intergranular lanes dark.
- **Supergranulation** — the same construction two orders of magnitude larger.
- **Sunspots** — low-frequency noise gated to two latitude belts either side of
  the equator, following the butterfly diagram. Each spot has a dark umbra
  inside a filamentary penumbra; the umbra is darkened to roughly a fifth of the
  surrounding brightness, which is what Stefan–Boltzmann gives for 4000 K
  against a 5800 K photosphere.
- **Faculae** — the bright magnetic network in the lanes, whose contrast
  reverses near the limb and becomes visible there.
- **Flares** — a low-frequency field sets a per-region phase and a steep power
  on `sin()` turns each event into a brief flash. The smooth part of that field
  also **displaces the mesh in the vertex shader**, so eruptions physically lift
  the surface; the filamentary detail is added per-fragment, where it cannot
  spike the geometry.
- **Differential rotation** — the sample frame is sheared by
  `1 − 0.36·sin²(lat)`, so the equator laps the poles.
- **Limb darkening** — the classic `I(μ) = 0.32 + 0.68·μ^0.55`.

Around it sit a chromosphere shell carrying spicules and prominences, and a
corona. The corona is drawn as a camera-facing quad rather than a shell: a shell
large enough to hold a realistic corona encloses the camera as soon as you fly
in close, and back-face culling then makes it vanish. Radius and latitude are
still derived from world positions, so the polar coronal holes stay locked to
the Sun's real rotation axis while equatorial helmet streamers crowd the middle.

### Planets and moons

Nine surface routines selected by `#define` at compile time, so no branch
survives into the inner loop:

`cratered` · `terran` · `martian` · `venusian` · `gasgiant` · `icegiant` ·
`icy` · `volcanic` · `haze`

Highlights of what each does:

- **Cratered** bodies build overlapping crater populations at three scales, each
  crater a depressed bowl inside a raised rim, with roughly half the cells left
  empty so the field never looks tiled. On top go bright ejecta rays from the
  freshest impacts, lunar maria, Ganymede's grooved terrain and Charon's stained
  pole.
- **Earth** derives continents from a 7-octave fbm thresholded at sea level,
  then biomes from an aridity field crossed with the subtropical dry belts, a
  snow line from latitude and elevation, sea ice, a specular ocean, a weather
  deck banded into an ITCZ and mid-latitude storm tracks, and coastal city
  lights that only appear on the night side.
- **Gas giants** shear the sample longitude as a function of latitude so each
  band drifts at its own rate, then warp the domain into ribbons. Belt spacing
  is irregular — the latitude is perturbed by a one-dimensional field, which
  keeps it constant along each parallel exactly as zonal banding behaves. The
  Great Red Spot is an anticyclonic oval whose interior swirl angle winds up
  toward the centre, with a turbulent wake trailing west. Saturn gets its north
  polar hexagon.
- **Ice giants** scale their bright zone tops by how turbulent the atmosphere
  is, so Uranus stays the near-featureless disc it actually is.
- **Io** paints sulfur allotropes over volcanic calderas whose active vents
  glow on the night side.
- **Pluto** gets Sputnik Planitia with convection cells inside it; **Triton**
  gets cantaloupe terrain and southward geyser streaks; **Europa** gets its
  lineae.

All solid surfaces are analytically bump-mapped: the height field is sampled
along two tangents and the gradient perturbs the normal.

### Atmospheres

An oversized shell rendered additively, matched to the planet's oblateness so it
does not stand proud at the poles. Alpha rises with the path length through the
shell, the limb between the viewer and the Sun picks up forward Mie scattering,
and the band straddling the terminator reddens the way a real sunset does.

Bodies with atmospheres: Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune,
Titan and Pluto.

### Rings

The radial optical-depth profile is procedural: broad C/B/A structure with the
Cassini division between B and A, the narrow Encke and Keeler gaps carved out of
the A ring, and fbm ringlet structure at two scales on top. Grazing views
thicken the sheet; particles both reflect toward the Sun and forward-scatter, so
the unlit face still glows. The planet casts a shadow onto the rings, and the
rings cast a structured shadow back onto the planet — the planet shader traces
the sun ray back through the ring plane and samples the *same* density function.

### Shadows

Up to four occluders per body produce real penumbral eclipse shadows, comparing
the angular radius of the occluder against that of the Sun (with an annular case
when the occluder is the smaller). This is what puts Io's shadow on Jupiter's
cloud tops and darkens the Moon during a lunar eclipse.

## The asteroid belt

Two tiers, because asteroids and planets have completely different cost
profiles.

**Ceres, Vesta, Pallas and Hygiea** — between them about 55% of the belt's mass
— are ordinary members of the N-body catalogue. They are integrated, perturbed
by Jupiter, clickable, and get procedural surfaces like everything else. Adding
four bodies takes the pair count from 190 to 276, which is free.

**Everything else** is one `THREE.Points` with a Kepler solver in the *vertex
shader*. Each asteroid's orbit is baked into static attributes at startup;
every frame the GPU advances the mean anomaly and solves `M = E − e·sin E` to
place the point. No integration, no per-frame uploads, one draw call.

Why that is legitimate rather than a shortcut:

- The whole main belt masses ~1.5 × 10⁻⁹ M☉. Jupiter alone is 630,000× heavier.
  Asteroids feel gravity but exert none that matters, so they are genuine test
  particles. Putting 10,000 of them into the N-body sum would mean 50 million
  pairs per step — about 508 seconds per frame.
- Belt orbits are stable over centuries *except* in mean-motion resonance with
  Jupiter — and those resonances are the Kirkwood gaps, which are carved out as
  empty. The regions where closed-form Kepler propagation would be wrong are
  exactly the regions left with nothing in them.

Measured cost at 1280×720 with 60,000 asteroids, against a ~0.8 ms baseline:

| View | Belt cost |
| --- | --- |
| System view | within noise |
| Top-down on the belt | +79 µs |
| Flying through the belt | +223 µs |

The population slider is a `drawRange` change over a pre-generated buffer, so it
costs nothing to move — asteroids are generated in randomised group order, which
makes the first N an unbiased sample of the whole population.

### Structure

Semi-major axes are rejection-sampled against a density profile with the
resonance gaps subtracted, positioned from `a = a_J · (q/p)^(2/3)` rather than
hardcoded. Eccentricity and inclination are Rayleigh-distributed (mean i ≈ 10°),
so the belt is a torus rather than a flat ring. Taxonomy sorts by distance:
stony S-types in the inner belt, dark carbonaceous C-types outward.

**The gaps will not be visible as gaps in the picture, and that is correct.**
Kirkwood gaps are gaps in semi-major axis. With typical eccentricities near 0.1,
an asteroid's actual distance swings ±0.3 AU across its orbit, which smears the
structure out of any snapshot of positions. Real Kirkwood plots are histograms
of `a`, not photographs. Histogramming the generated belt shows the 3:1 gap
dropping from 535 to 194 and recovering to 604 either side, with the 5:2 and 7:3
showing the same signature.

About a sixth of the population sits in **Jupiter's Trojan clouds**, 60° ahead of
and behind it at L4 and L5, with L4 slightly the more populated as in reality.
Every Trojan shares Jupiter's semi-major axis *exactly*: give them a spread and
their periods differ, and the clouds smear into a complete ring within a century
or two. Real Trojans stay clumped only because they librate about L4/L5 under
Jupiter's influence, which closed-form Kepler cannot reproduce — identical `a`
keeps them stable indefinitely, and the spread in e and i still gives the clouds
their real volume.

## Scale

Real bodies at real distances are invisible: Earth is 4.3 × 10⁻⁵ AU across. The
default view therefore draws planets 320× life size and the Sun 26×, with a
separate multiplier pushing moon orbits outward so satellites clear their
(also enlarged) primaries.

**Distances and physics are never scaled.** Only the drawn radii and the moon
orbit offsets are, and all three are sliders — *true scale* sets them all to 1×.
One consequence worth knowing: eclipse shadows follow the displayed geometry, so
at default settings Io's shadow on Jupiter is larger than the real one.

## Layout

```
index.html            page shell, social meta tags, control panel markup
styles.css
og/
  cover.png           1200×630 social share card — what ships
  cover.svg           vector source it was rasterised from
  generate-cover.mjs  rebuilds the SVG (zero dependencies)
  README.md           spec, regeneration, preview validators
src/
  main.js             renderer, bloom chain, simulation loop, input
  constants.js        units, G, scale defaults, integrator limits
  data.js             body catalogue: elements, masses, radii, shader params
  orbital.js          Kepler solver, elements <-> state vectors, frames
  physics.js          N-body integrator, energy diagnostics
  system.js           initial conditions, barycentre splitting, epochs
  scene.js            scene graph, per-frame sync, orbits, trails, labels
  controls.js         orbit / dolly / pan camera
  ui.js               panel, body picker, info card
  shaders/
    noise.js          simplex, fbm, ridged, turbulence, Worley, craters, warp
    sun.js            photosphere, chromosphere, corona
    planet.js         nine surface types, bump, eclipses, ring shadows
    atmosphere.js
    rings.js
    stars.js          starfield and Milky Way
    belt.js           asteroid belt + Trojans, Kepler solved in the vertex shader
vendor/               three.js r160 + the postprocessing modules for bloom
```

## Known approximations

- Moon elements are approximate means at J2000; their node and mean anomaly are
  representative rather than exact. The geometry that matters — semi-major axis,
  eccentricity, inclination, orbital sense — is right, and orbits stay bounded.
  Seeding mean elements as osculating ones leaves the Moon's eccentricity
  oscillating over roughly 0.045–0.10 against a real 0.026–0.077; it is bounded
  and does not drift.
- Only the mean anomaly is advanced when starting away from J2000; the
  slowly-varying elements keep their epoch values.
- Planetary spin axes are placed using the orbital node rather than the true
  pole right ascension, which is accurate in obliquity but not in pole
  longitude.
- Time rate is capped at 40 simulated days per frame. Past that the 0.05-day
  step would no longer resolve Io's 1.77-day orbit.
- Belt asteroids are synthetic — statistically faithful in `a`, `e`, `i` and
  taxonomy, but not real objects. Swapping in a real MPCORB subset is a drop-in
  change: the attribute layout is already elements-per-asteroid, so it is only
  a matter of filling the buffers from a data file instead of a PRNG.
- Belt asteroids move on fixed Keplerian ellipses and are not perturbed, so
  they will not show resonance sculpting, family dispersion, or Trojan
  libration developing over a run — that structure is baked in at generation
  rather than emerging.
- The Trojan clouds are anchored to Jupiter's mean longitude at the epoch. Since
  Jupiter is N-body integrated and they are not, the clouds drift very slowly
  against it over centuries.
