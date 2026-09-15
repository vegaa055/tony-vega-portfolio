"use client";

import clsx from "clsx";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavLinkProps = {
  href: Route;
  /** Only active on this exact path (for the dashboard at /admin). */
  exact?: boolean;
  children: React.ReactNode;
};

export function AdminNavLink({ href, exact, children }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={clsx(
        "relative flex items-center px-2 font-mono text-[0.62rem] tracking-[0.12em] uppercase transition-colors duration-300 sm:px-3",
        isActive ? "text-star" : "text-dust hover:text-star",
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-x-2 -bottom-px h-px bg-flare transition-opacity sm:inset-x-3",
          isActive ? "opacity-100" : "opacity-0",
        )}
      />
    </Link>
  );
}
