type OrbitMarkProps = {
  className?: string;
};

/** The site mark: a star with one planet on an inclined orbit. */
export function OrbitMark({ className }: OrbitMarkProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <ellipse
        cx="16"
        cy="16"
        rx="12"
        ry="5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-24 16 16)"
      />
      <circle cx="16" cy="16" r="4.2" className="fill-flare" />
      {/* Sits exactly on the ellipse (30° before the rightmost point). */}
      <circle cx="24.35" cy="9.22" r="1.9" fill="currentColor" />
    </svg>
  );
}
