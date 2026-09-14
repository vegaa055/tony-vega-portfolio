import clsx from "clsx";
import Image from "next/image";

import type { ContentImage } from "@/db/schema";

type ProjectCoverProps = {
  image: ContentImage | null;
  /** Seeds the generated artwork when there's no image. */
  slug: string;
  title: string;
  sizes: string;
  preload?: boolean;
  className?: string;
};

/**
 * Fills its (relatively positioned, sized) parent with the project's cover
 * image, or with generated artwork when the project has none.
 */
export function ProjectCover({
  image,
  slug,
  title,
  sizes,
  preload,
  className,
}: ProjectCoverProps) {
  if (image) {
    return (
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        preload={preload}
        className={clsx("object-cover", className)}
      />
    );
  }

  return <GeneratedCover slug={slug} title={title} className={className} />;
}

/** FNV-1a: a small, stable hash so each project gets the same artwork. */
function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WIDTH = 640;
const HEIGHT = 400;
const TRACES = 7;

/** Oscilloscope-style traces, unique per slug. Purely decorative. */
function GeneratedCover({
  slug,
  title,
  className,
}: {
  slug: string;
  title: string;
  className?: string;
}) {
  const random = createRandom(hash(slug));

  const traces = Array.from({ length: TRACES }, (_, index) => {
    const cycles = 1 + random() * 3.5;
    const phase = random() * Math.PI * 2;
    const amplitude = 14 + random() * 42;
    const baseline = 92 + index * ((HEIGHT - 184) / (TRACES - 1));
    const points: string[] = [];

    for (let x = 0; x <= WIDTH; x += 8) {
      const t = x / WIDTH;
      // Taper toward the edges so every trace starts and ends flat.
      const envelope = Math.sin(Math.PI * t);
      const y =
        baseline +
        Math.sin(t * Math.PI * 2 * cycles + phase) * amplitude * envelope;
      points.push(`${x},${y.toFixed(1)}`);
    }

    return `M${points.join("L")}`;
  });

  return (
    <div
      aria-hidden="true"
      className={clsx("absolute inset-0 bg-deep", className)}
    >
      <div className="dot-grid absolute inset-0 opacity-70" />
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        {traces.map((d, index) => (
          <path
            key={index}
            d={d}
            fill="none"
            strokeWidth={index === 3 ? 1.5 : 1}
            className={index === 3 ? "stroke-flare" : "stroke-line-strong"}
          />
        ))}
      </svg>
      <span className="absolute bottom-4 left-5 font-mono text-[0.58rem] tracking-[0.18em] text-faint uppercase">
        {title}
      </span>
    </div>
  );
}
