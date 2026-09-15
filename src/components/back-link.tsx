import type { Route } from "next";
import Link from "next/link";

type BackLinkProps<T extends string> = {
  href: Route<T>;
  children: React.ReactNode;
};

export function BackLink<T extends string>({
  href,
  children,
}: BackLinkProps<T>) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-6 items-center gap-2 font-mono text-label tracking-[0.16em] text-faint uppercase transition-colors duration-300 hover:text-star"
    >
      <span
        aria-hidden="true"
        className="transition-transform duration-500 ease-out-expo group-hover:-translate-x-1"
      >
        ←
      </span>
      {children}
    </Link>
  );
}
