import { cacheLife } from "next/cache";
import Link from "next/link";

import { siteConfig } from "@/config/site";

/**
 * Cached so the footer stays part of the prerendered page (reading the clock
 * during render would otherwise make it dynamic). Refreshes daily.
 */
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const linkClass = "text-dust transition-colors duration-300 hover:text-star";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-site flex-col gap-8 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex items-center gap-3 font-mono text-[0.66rem] tracking-[0.16em] text-faint uppercase">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-flare shadow-[0_0_10px_1px_rgb(255_106_77/0.6)]"
          />
          <span>
            © <CopyrightYear /> {siteConfig.name}
          </span>
        </p>

        <ul className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase">
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              GitHub <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
