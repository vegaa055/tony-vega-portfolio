import Link from "next/link";

import { NavLink } from "@/components/nav-link";
import { OrbitMark } from "@/components/orbit-mark";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-void/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-site items-center justify-between gap-3 px-4 sm:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 font-mono text-[0.7rem] tracking-[0.18em] text-star uppercase"
        >
          <OrbitMark className="size-6 text-dust transition-transform duration-700 ease-out-expo group-hover:rotate-[28deg]" />
          {siteConfig.name}
        </Link>

        <nav aria-label="Main" className="h-full">
          <ul className="flex h-full items-stretch">
            {siteConfig.nav.map((item, index) => (
              <li key={item.href} className="flex">
                <NavLink href={item.href} index={index + 1}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
