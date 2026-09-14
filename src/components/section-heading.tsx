import type { Route } from "next";
import Link from "next/link";

type SectionHeadingProps<T extends string> = {
  /** Used by the section's aria-labelledby. */
  id: string;
  index: string;
  title: string;
  link?: { href: Route<T>; label: string };
};

export function SectionHeading<T extends string>({
  id,
  index,
  title,
  link,
}: SectionHeadingProps<T>) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
      <h2
        id={id}
        className="font-mono text-[0.72rem] tracking-[0.2em] text-dust uppercase"
      >
        {/* The catalog number is decoration; the heading's name is the title. */}
        <span aria-hidden="true">
          <span className="text-flare">{index}</span>{" "}
          <span className="text-faint">/</span>{" "}
        </span>
        {title}
      </h2>
      {link ? (
        <Link
          href={link.href}
          className="group inline-flex shrink-0 items-center gap-2 font-mono text-[0.66rem] tracking-[0.16em] text-faint uppercase transition-colors duration-300 hover:text-star"
        >
          {link.label}
          <span
            aria-hidden="true"
            className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      ) : null}
    </div>
  );
}
