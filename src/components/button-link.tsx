import clsx from "clsx";
import type { Route } from "next";
import Link from "next/link";

type Variant = "primary" | "ghost" | "danger" | "quiet";
type Size = "md" | "sm";

/** Shared button styles, for links and <button> elements alike. */
export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return clsx(
    "group inline-flex shrink-0 items-center justify-center gap-3 rounded-xs font-mono tracking-[0.16em] uppercase transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50",
    size === "md" ? "h-11 px-5 text-[0.68rem]" : "h-9 px-3.5 text-[0.62rem]",
    {
      primary: "bg-flare text-void hover:bg-flare-soft",
      ghost: "border border-line-strong text-star hover:border-dust",
      danger:
        "border border-flare/60 text-flare-soft hover:border-flare hover:bg-flare/10",
      quiet: "text-dust hover:bg-nebula hover:text-star",
    }[variant],
  );
}

type ButtonLinkProps<T extends string> = {
  href: Route<T>;
  variant?: Variant;
  size?: Size;
  /** Show the trailing arrow (on by default). */
  arrow?: boolean;
  children: React.ReactNode;
};

/** A button-styled link to a page on this site. */
export function ButtonLink<T extends string>({
  href,
  variant = "primary",
  size = "md",
  arrow = true,
  children,
}: ButtonLinkProps<T>) {
  return (
    <Link href={href} className={buttonClass(variant, size)}>
      {children}
      {arrow ? (
        <span
          aria-hidden="true"
          className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
        >
          →
        </span>
      ) : null}
    </Link>
  );
}

type ExternalButtonProps = {
  href: string;
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
};

/** A button-styled link to another site, opened in a new tab. */
export function ExternalButton({
  href,
  variant = "primary",
  size = "md",
  children,
}: ExternalButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={buttonClass(variant, size)}
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
