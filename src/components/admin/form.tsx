import clsx from "clsx";

/** Base style for text inputs, textareas, and selects in the admin. */
export const inputClass = clsx(
  "w-full rounded-xs border border-field bg-deep px-3 py-2.5 text-[0.95rem] text-star placeholder:text-faint",
  "transition-colors duration-200 hover:border-dust/60",
  // A 2px ring over the border. A color change alone is faint, and can't be
  // seen at all on a field that's already marked with an error. focus-within
  // also covers the calendar button inside a date field.
  "focus-within:border-flare focus-within:outline-2 focus-within:-outline-offset-1",
  "disabled:opacity-60 aria-invalid:border-flare",
);

export const labelClass =
  "block font-mono text-micro tracking-[0.16em] text-dust uppercase";

type FieldProps = {
  /** The id of the control this field labels. */
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * A label, a control, and optional hint and error text. Give the control
 * `id`, and `aria-describedby={describedBy(id, hint, error)}`.
 */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-xs leading-relaxed text-faint"
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-flare-soft">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The aria-describedby value for a control inside <Field>. */
export function describedBy(id: string, hint?: unknown, error?: unknown) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null];
  return ids.filter(Boolean).join(" ") || undefined;
}

/** A status line for form results, announced to screen readers. */
export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-xs border px-3 py-2.5 text-sm",
        tone === "error"
          ? "border-flare/50 bg-flare/10 text-flare-soft"
          : "border-line-strong bg-nebula text-star",
      )}
    >
      {children}
    </p>
  );
}
