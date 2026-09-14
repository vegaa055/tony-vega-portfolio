import clsx from "clsx";

type ReticleProps = {
  tone?: "accent" | "muted";
  className?: string;
};

/** Viewfinder corner marks. Place inside a relatively positioned element. */
export function Reticle({ tone = "muted", className }: ReticleProps) {
  const corner = clsx(
    "absolute size-3",
    tone === "accent" ? "border-flare/80" : "border-line-strong",
  );

  return (
    <div
      aria-hidden="true"
      className={clsx("pointer-events-none absolute inset-0", className)}
    >
      <span className={clsx(corner, "top-0 left-0 border-t border-l")} />
      <span className={clsx(corner, "top-0 right-0 border-t border-r")} />
      <span className={clsx(corner, "bottom-0 left-0 border-b border-l")} />
      <span className={clsx(corner, "right-0 bottom-0 border-r border-b")} />
    </div>
  );
}
