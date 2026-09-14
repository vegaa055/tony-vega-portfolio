import clsx from "clsx";
import type { Route } from "next";
import Link from "next/link";

type Variant = "primary" | "ghost";

function buttonClass(variant: Variant) {
  return clsx(
    "group inline-flex h-11 items-center gap-3 rounded-xs px-5 font-mono text-[0.68rem] tracking-[0.16em] uppercase transition-colors duration-300",
    variant === "primary"
      ? "bg-flare text-void hover:bg-flare-soft"
      : "border border-line-strong text-star hover:border-dust",
  );
}

type ButtonLinkProps<T extends string> = {
  href: Route<T>;
  variant?: Variant;
  children: React.ReactNode;
};

/** A button-styled link to a page on this site. */
export function ButtonLink<T extends string>({
  href,
  variant = "primary",
  children,
}: ButtonLinkProps<T>) {
  return (
    <Link href={href} className={buttonClass(variant)}>
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

type ExternalButtonProps = {
  href: string;
  variant?: Variant;
  children: React.ReactNode;
};

/** A button-styled link to another site, opened in a new tab. */
export function ExternalButton({
  href,
  variant = "primary",
  children,
}: ExternalButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={buttonClass(variant)}
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      >
        ↗
      </span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
