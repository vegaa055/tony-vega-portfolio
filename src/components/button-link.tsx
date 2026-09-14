import clsx from "clsx";
import type { Route } from "next";
import Link from "next/link";

type ButtonLinkProps<T extends string> = {
  href: Route<T>;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
};

export function ButtonLink<T extends string>({
  href,
  variant = "primary",
  children,
}: ButtonLinkProps<T>) {
  return (
    <Link
      href={href}
      className={clsx(
        "group inline-flex h-11 items-center gap-3 rounded-xs px-5 font-mono text-[0.68rem] tracking-[0.16em] uppercase transition-colors duration-300",
        variant === "primary"
          ? "bg-flare text-void hover:bg-flare-soft"
          : "border border-line-strong text-star hover:border-dust",
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
