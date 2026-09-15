import type { Metadata } from "next";

import { ButtonLink } from "@/components/button-link";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Page not found",
};

// Renders inside the root layout only, so it brings the site's frame itself.
export default function NotFound() {
  return (
    <SiteChrome>
      <section className="mx-auto max-w-site px-4 py-24 sm:px-8 sm:py-32">
        <p className="animate-rise font-mono text-[0.68rem] tracking-[0.2em] text-flare uppercase">
          Error 404
        </p>
        <h1 className="mt-5 animate-rise font-mono text-[clamp(2.5rem,8vw,5rem)] leading-none font-extralight tracking-[-0.03em] font-stretch-semi-expanded [animation-delay:80ms]">
          Signal lost
        </h1>
        <p className="mt-6 max-w-reading animate-rise text-lg leading-relaxed text-dust [animation-delay:160ms]">
          This page drifted out of range, or it never existed.
        </p>
        <div className="mt-10 animate-rise [animation-delay:240ms]">
          <ButtonLink href="/">Return home</ButtonLink>
        </div>
      </section>
    </SiteChrome>
  );
}
