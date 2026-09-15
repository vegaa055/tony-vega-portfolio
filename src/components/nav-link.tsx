"use client";

import clsx from "clsx";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: Route;
  /** Position in the menu, shown as a catalog number ("01"). */
  index: number;
  children: React.ReactNode;
};

export function NavLink({ href, index, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={clsx(
        "group relative flex items-center gap-1.5 px-1.5 font-mono text-label tracking-[0.08em] uppercase transition-colors duration-300 sm:px-3 sm:tracking-[0.12em]",
        isActive ? "text-star" : "text-dust hover:text-star",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "hidden text-micro transition-colors duration-300 sm:inline",
          isActive ? "text-flare" : "text-faint group-hover:text-flare",
        )}
      >
        {String(index).padStart(2, "0")}
      </span>
      {children}
      {/* Sits on the header's bottom hairline. */}
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-x-1.5 -bottom-px h-px origin-left bg-flare transition-transform duration-500 ease-out-expo sm:inset-x-3",
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
      />
    </Link>
  );
}
