"use client";

import clsx from "clsx";

import {
  describedBy,
  Field,
  inputClass,
  labelClass,
} from "@/components/admin/form";
import type { FieldErrors } from "@/lib/validation";

/** The first error for a field or anything inside it ("tags" or "tags.3"). */
export function firstError(errors: FieldErrors, key: string) {
  if (errors[key]) return errors[key];
  const nested = Object.entries(errors).find(([path]) =>
    path.startsWith(`${key}.`),
  );
  return nested?.[1];
}

type SlugFieldProps = {
  id: string;
  /** The public path before the slug, e.g. "/projects/". */
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Whether the page is live, so changing the URL would break links. */
  live: boolean;
  /** Whether the URL still follows the title as it's typed. */
  autoFill: boolean;
};

export function SlugField({
  id,
  prefix,
  value,
  onChange,
  error,
  live,
  autoFill,
}: SlugFieldProps) {
  const hint = live
    ? "This page is live. Changing its URL breaks links to the old address."
    : autoFill
      ? "Filled in from the title. Lowercase letters, numbers, and hyphens."
      : "Lowercase letters, numbers, and hyphens.";

  return (
    <Field id={id} label="URL" hint={hint} error={error}>
      <div
        className={clsx(
          "flex items-stretch rounded-xs border bg-deep transition-colors focus-within:border-flare",
          error ? "border-flare" : "border-line-strong",
        )}
      >
        <span
          aria-hidden="true"
          className="flex items-center border-r border-line pr-2 pl-3 font-mono text-[0.75rem] text-faint"
        >
          {prefix}
        </span>
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          spellCheck={false}
          autoCapitalize="off"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, hint, error)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-[0.85rem] text-star focus:outline-none"
        />
      </div>
    </Field>
  );
}

type PublishFieldsProps = {
  /** The id of the date input. */
  dateId: string;
  status: "draft" | "published";
  publishedAt: string;
  onStatusChange: (status: "draft" | "published") => void;
  onDateChange: (date: string) => void;
  errors: FieldErrors;
};

/** Draft or published, and the date shown on the site. */
export function PublishFields({
  dateId,
  status,
  publishedAt,
  onStatusChange,
  onDateChange,
  errors,
}: PublishFieldsProps) {
  const dateHint =
    "Leave empty to use the day you publish. Set an earlier date for older work.";

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={labelClass}>Status</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(
            [
              { value: "draft", label: "Draft", note: "Only visible here" },
              {
                value: "published",
                label: "Published",
                note: "Live on the site",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={clsx(
                "cursor-pointer rounded-xs border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flare",
                status === option.value
                  ? "border-flare bg-flare/10"
                  : "border-line-strong hover:border-dust",
              )}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={status === option.value}
                onChange={() => onStatusChange(option.value)}
                className="sr-only"
              />
              <span className="block text-sm text-star">{option.label}</span>
              <span className="block text-xs text-faint">{option.note}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id={dateId}
        label="Publish date"
        hint={dateHint}
        error={errors.publishedAt}
      >
        <input
          id={dateId}
          type="date"
          value={publishedAt}
          onChange={(event) => onDateChange(event.target.value)}
          aria-invalid={Boolean(errors.publishedAt)}
          aria-describedby={describedBy(dateId, dateHint, errors.publishedAt)}
          className={clsx(inputClass, "[color-scheme:dark]")}
        />
      </Field>
    </div>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  type?: "text" | "url";
  placeholder?: string;
  multiline?: number;
};

/** A labeled text input or textarea wired up for hints and errors. */
export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  type = "text",
  placeholder,
  multiline,
}: TextFieldProps) {
  const shared = {
    id,
    value,
    placeholder,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy(id, hint, error),
    className: inputClass,
  };

  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {multiline ? (
        <textarea
          {...shared}
          rows={multiline}
          onChange={(event) => onChange(event.target.value)}
          className={clsx(inputClass, "resize-y leading-relaxed")}
        />
      ) : (
        <input
          {...shared}
          type={type}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}
