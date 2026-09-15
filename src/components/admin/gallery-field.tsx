"use client";

import { useRef, useState } from "react";

import {
  describedBy,
  Field,
  inputClass,
  labelClass,
} from "@/components/admin/form";
import { buttonClass } from "@/components/button-link";
import type { ContentImage } from "@/db/schema";
import { uploadImage } from "@/lib/uploads/client";
import { IMAGE_ACCEPT, type UploadMode } from "@/lib/uploads/shared";
import type { FieldErrors } from "@/lib/validation";

type GalleryFieldProps = {
  id: string;
  label: string;
  value: ContentImage[];
  onChange: (value: ContentImage[]) => void;
  uploadMode: UploadMode;
  /** Errors keyed by position, e.g. "2.alt" (see errorsAt). */
  errors?: FieldErrors;
  hint?: string;
};

/** An ordered list of images, each with a description and optional caption. */
export function GalleryField({
  id,
  label,
  value,
  onChange,
  uploadMode,
  errors = {},
  hint,
}: GalleryFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function add(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    setNotice(
      files.length === 1
        ? "Uploading image…"
        : `Uploading ${files.length} images…`,
    );
    const added: ContentImage[] = [];
    try {
      for (const file of files) {
        added.push({ ...(await uploadImage(file, uploadMode)), alt: "" });
      }
      setNotice(
        `Added ${added.length === 1 ? "an image" : `${added.length} images`}. Describe each one below.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The upload failed.");
    } finally {
      // Keep whatever finished uploading, even if a later file failed.
      if (added.length > 0) onChange([...value, ...added]);
      setUploading(false);
    }
  }

  const update = (index: number, image: ContentImage) =>
    onChange(
      value.map((item, position) => (position === index ? image : item)),
    );

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className={labelClass}>{label}</legend>
      {hint ? (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-xs leading-relaxed text-faint"
        >
          {hint}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ol className="mt-4 space-y-4">
          {value.map((image, index) => {
            const altId = `${id}-${index}-alt`;
            const captionId = `${id}-${index}-caption`;
            const number = index + 1;
            return (
              <li
                key={image.url}
                className="grid gap-4 rounded-xs border border-line p-4 sm:grid-cols-[10rem_minmax(0,1fr)]"
              >
                <div className="relative aspect-video overflow-hidden rounded-xs border border-line bg-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    className="size-full object-contain"
                  />
                </div>
                <div className="space-y-3">
                  <Field
                    id={altId}
                    label={`Image ${number} description`}
                    error={errors[`${index}.alt`]}
                  >
                    <input
                      id={altId}
                      value={image.alt}
                      onChange={(event) =>
                        update(index, { ...image, alt: event.target.value })
                      }
                      aria-invalid={Boolean(errors[`${index}.alt`])}
                      aria-describedby={describedBy(
                        altId,
                        undefined,
                        errors[`${index}.alt`],
                      )}
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    id={captionId}
                    label="Caption (optional)"
                    error={errors[`${index}.caption`]}
                  >
                    <input
                      id={captionId}
                      value={image.caption ?? ""}
                      onChange={(event) =>
                        update(index, {
                          ...image,
                          caption: event.target.value || undefined,
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move image ${number} earlier`}
                      className={buttonClass("quiet", "sm")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === value.length - 1}
                      aria-label={`Move image ${number} later`}
                      className={buttonClass("quiet", "sm")}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(
                          value.filter((_, position) => position !== index),
                        )
                      }
                      aria-label={`Remove image ${number}`}
                      className={buttonClass("quiet", "sm")}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      {/* An error about the whole gallery, like too many images. */}
      {errors[""] ? (
        <p className="mt-3 text-xs text-flare-soft">{errors[""]}</p>
      ) : null}

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void add([...event.dataTransfer.files]);
        }}
        className="mt-4 rounded-xs border border-dashed border-line-strong px-4 py-6 text-center"
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={buttonClass("ghost", "sm")}
        >
          {uploading ? "Uploading…" : "Add images"}
        </button>
        <p className="mt-3 text-xs text-faint">Or drop them here.</p>
      </div>

      <p role="status" className="mt-2 text-xs text-dust empty:hidden">
        {notice}
      </p>

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          void add([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
    </fieldset>
  );
}
