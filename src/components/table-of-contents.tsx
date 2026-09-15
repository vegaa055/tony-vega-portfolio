import clsx from "clsx";

import type { Heading } from "@/lib/markdown/render";

type TableOfContentsProps = {
  headings: Heading[];
  className?: string;
};

/** Links to a page's sections. Hidden when there are too few to help. */
export function TableOfContents({ headings, className }: TableOfContentsProps) {
  if (headings.length < 3) return null;

  return (
    <nav aria-labelledby="contents-heading" className={className}>
      <h2
        id="contents-heading"
        className="font-mono text-micro tracking-[0.18em] text-faint uppercase"
      >
        Contents
      </h2>
      <ol className="mt-4 border-l border-line">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={clsx(
                "-ml-px block border-l border-transparent py-1.5 pl-4 text-sm leading-snug text-dust",
                "transition-colors duration-300 hover:border-flare hover:text-star",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
