"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

import { buttonClass, ButtonLink } from "@/components/button-link";

/** Shown inside the site's frame when a page fails to load. */
export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-site px-4 py-24 sm:px-8 sm:py-32">
      <p className="font-mono text-label tracking-[0.2em] text-flare uppercase">
        Error
      </p>
      <h1 className="mt-5 font-mono text-[clamp(2.5rem,8vw,5rem)] leading-none font-extralight tracking-[-0.03em] font-stretch-semi-expanded">
        Interference
      </h1>
      <p className="mt-6 max-w-reading text-lg leading-relaxed text-dust">
        This page couldn&apos;t load. It&apos;s usually temporary, so try again
        in a moment.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className={buttonClass("primary")}
        >
          Try again
        </button>
        <ButtonLink href="/" variant="ghost">
          Return home
        </ButtonLink>
      </div>
    </section>
  );
}
