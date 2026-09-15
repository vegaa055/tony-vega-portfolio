"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

import { buttonClass, ButtonLink } from "@/components/button-link";

/** Shown inside the admin shell when a page or action fails unexpectedly. */
export default function AdminError({
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
    <div className="py-16">
      <p className="font-mono text-[0.68rem] tracking-[0.2em] text-flare uppercase">
        Error
      </p>
      <h1 className="mt-4 font-mono text-3xl font-extralight text-star font-stretch-semi-expanded">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-reading text-dust">
        This page couldn&apos;t load or finish what it was doing. It may be a
        dropped connection, or the database may be unavailable.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-faint">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className={buttonClass("primary")}
        >
          Try again
        </button>
        <ButtonLink href="/admin" variant="ghost">
          Back to content
        </ButtonLink>
      </div>
    </div>
  );
}
