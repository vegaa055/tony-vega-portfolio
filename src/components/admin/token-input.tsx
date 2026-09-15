"use client";

import { useState } from "react";

import { describedBy, labelClass } from "@/components/admin/form";

type TokenInputProps = {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  hint?: string;
  error?: string;
};

/** A list of short labels (tags, tools). Enter or a comma adds one. */
export function TokenInput({
  id,
  label,
  values,
  onChange,
  suggestions = [],
  placeholder,
  hint,
  error,
}: TokenInputProps) {
  const [draft, setDraft] = useState("");
  const listId = `${id}-suggestions`;
  const taken = new Set(values.map((value) => value.toLowerCase()));
  const available = suggestions.filter(
    (item) => !taken.has(item.toLowerCase()),
  );

  function add(raw: string) {
    const token = raw.trim().replace(/\s+/g, " ");
    setDraft("");
    if (token && !taken.has(token.toLowerCase())) onChange([...values, token]);
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xs border border-line-strong bg-deep p-1.5 transition-colors focus-within:border-flare">
        {values.map((token) => (
          <span
            key={token}
            className="inline-flex items-center gap-1 rounded-xs bg-nebula py-1 pr-1 pl-2 font-mono text-[0.62rem] tracking-[0.08em] text-star uppercase"
          >
            {token}
            <button
              type="button"
              onClick={() =>
                onChange(values.filter((value) => value !== token))
              }
              aria-label={`Remove ${token}`}
              className="inline-flex size-5 items-center justify-center rounded-xs text-dust transition-colors hover:bg-line hover:text-star"
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          list={available.length > 0 ? listId : undefined}
          placeholder={values.length === 0 ? placeholder : undefined}
          onChange={(event) => {
            const next = event.target.value;
            if (next.endsWith(",")) add(next.slice(0, -1));
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (
              event.key === "Backspace" &&
              !draft &&
              values.length > 0
            ) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, hint, error)}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm text-star placeholder:text-faint focus:outline-none"
        />
      </div>
      {available.length > 0 ? (
        <datalist id={listId}>
          {available.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      ) : null}
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
