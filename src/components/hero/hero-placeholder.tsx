import { Reticle } from "@/components/reticle";

import styles from "./hero-placeholder.module.css";

type Orbit = {
  /** Ring diameter as a share of the orbital plane. */
  size: string;
  /** Kepler's third law: period grows with radius^1.5 (inner orbit = 9s). */
  period: string;
  /** Starting angle, so the planets don't line up. */
  phase: string;
  planetSize: string;
  planetColor: string;
};

const ORBITS: Orbit[] = [
  {
    size: "30%",
    period: "9s",
    phase: "40deg",
    planetSize: "0.45rem",
    planetColor: "#c9beb3",
  },
  {
    size: "48%",
    period: "18.2s",
    phase: "210deg",
    planetSize: "0.7rem",
    planetColor: "#8fa3d9",
  },
  {
    size: "68%",
    period: "30.7s",
    phase: "120deg",
    planetSize: "0.55rem",
    planetColor: "#c98b76",
  },
  {
    size: "92%",
    period: "48.3s",
    phase: "300deg",
    planetSize: "1rem",
    planetColor: "#e2d2b4",
  },
];

/**
 * Stand-in for the WebGPU hero scene. Purely decorative, so it's hidden from
 * assistive technology.
 */
export function HeroPlaceholder() {
  return (
    <figure aria-hidden="true" className={styles.figure}>
      <Reticle tone="accent" />

      <div className={styles.scene}>
        <div className={styles.halo} />
        <div className={styles.plane}>
          <div className={styles.star} />
          {ORBITS.map((orbit) => (
            <div
              key={orbit.size}
              className={styles.orbit}
              style={
                {
                  "--size": orbit.size,
                  "--period": orbit.period,
                  "--phase": orbit.phase,
                  "--planet-size": orbit.planetSize,
                  "--planet-color": orbit.planetColor,
                } as React.CSSProperties
              }
            >
              <span className={styles.planet} />
            </div>
          ))}
        </div>
      </div>

      {/* Vega (α Lyrae) — the star that shares the name. */}
      {/* Not uppercased: that would turn α into a Latin-looking "A" and break
          the lowercase h/m/s units of right ascension. */}
      <p className="absolute top-3 right-4 font-mono text-micro tracking-[0.08em] text-faint">
        α Lyr · 18h 36m 56s · +38° 47′
      </p>
      <figcaption className="absolute bottom-3 left-4 font-mono text-micro tracking-[0.16em] text-faint uppercase">
        Fig. 01 — Orrery
      </figcaption>
    </figure>
  );
}
