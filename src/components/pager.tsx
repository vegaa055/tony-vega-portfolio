import clsx from "clsx";
import type { Route } from "next";
import Link from "next/link";

import { displayFont } from "@/lib/fonts";

type PagerLink = {
  href: Route;
  title: string;
};

type PagerProps = {
  /** Names the navigation for screen readers, e.g. "More projects". */
  label: string;
  previous: (PagerLink & { caption: string }) | null;
  next: (PagerLink & { caption: string }) | null;
};

/** Previous/next links at the end of a project or post. */
export function Pager({ label, previous, next }: PagerProps) {
  if (!previous && !next) return null;

  return (
    <nav aria-label={label} className="border-t border-line">
      <div className="mx-auto grid max-w-site sm:grid-cols-2">
        {previous ? (
          <PagerCard link={previous} direction="previous" />
        ) : (
          <div className="hidden sm:block" />
        )}
        {next ? <PagerCard link={next} direction="next" /> : null}
      </div>
    </nav>
  );
}

function PagerCard({
  link,
  direction,
}: {
  link: PagerLink & { caption: string };
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";

  return (
    <Link
      href={link.href}
      className={clsx(
        "group block px-4 py-10 transition-colors duration-300 hover:bg-deep/60 sm:px-8 sm:py-12",
        isNext &&
          "border-t border-line sm:border-t-0 sm:border-l sm:text-right",
      )}
    >
      <span className="font-mono text-micro tracking-[0.18em] text-faint uppercase">
        {isNext ? null : <span aria-hidden="true">← </span>}
        {link.caption}
        {isNext ? <span aria-hidden="true"> →</span> : null}
        {/* Keeps screen readers from running the caption into the title. */}
        <span className="sr-only">: </span>
      </span>
      <span
        className={`${displayFont.className} mt-3 block text-lg tracking-[-0.01em] text-balance wrap-anywhere text-star transition-colors duration-300 group-hover:text-flare-soft sm:text-xl`}
      >
        {link.title}
      </span>
    </Link>
  );
}
