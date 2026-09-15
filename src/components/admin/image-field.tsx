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

type ImageFieldProps = {
  id: string;
  label: string;
  value: ContentImage | null;
  onChange: (value: ContentImage | null) => void;
  uploadMode: UploadMode;
  /** Errors for this image, keyed "url", "alt", "caption" (see errorsAt). */
  errors?: FieldErrors;
  showCaption?: boolean;
  hint?: string;
};

/** Upload, replace, or remove one image, with its description and caption. */
export function ImageField({
  id,
  label,
  value,
  onChange,
  uploadMode,
  errors = {},
  showCaption = false,
  hint,
}: ImageFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const uploaded = await uploadImage(file, uploadMode);
      // A new image needs its own description, so the old one isn't kept.
      onChange({ ...uploaded, alt: "", caption: value?.caption });
      setNotice("Uploaded. Now describe the image.");
      requestAnimationFrame(() => altRef.current?.focus());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const altId = `${id}-alt`;
  const captionId = `${id}-caption`;
  const altHint = "What the image shows, for people using screen readers.";

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

      <div className="mt-3">
        {value ? (
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-xs border border-line bg-deep">
              {/* A preview of an upload whose size isn't known up front. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.url}
                alt=""
                className="size-full object-contain"
              />
            </div>

            <Field
              id={altId}
              label="Description (alt text)"
              hint={altHint}
              error={errors.alt}
            >
              <input
                ref={altRef}
                id={altId}
                value={value.alt}
                onChange={(event) =>
                  onChange({ ...value, alt: event.target.value })
                }
                aria-invalid={Boolean(errors.alt)}
                aria-describedby={describedBy(altId, altHint, errors.alt)}
                className={inputClass}
              />
            </Field>

            {showCaption ? (
              <Field
                id={captionId}
                label="Caption (optional)"
                error={errors.caption}
              >
                <input
                  id={captionId}
                  value={value.caption ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      caption: event.target.value || undefined,
                    })
                  }
                  aria-invalid={Boolean(errors.caption)}
                  aria-describedby={describedBy(
                    captionId,
                    undefined,
                    errors.caption,
                  )}
                  className={inputClass}
                />
              </Field>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={buttonClass("ghost", "sm")}
              >
                {uploading ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className={buttonClass("quiet", "sm")}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void upload(event.dataTransfer.files[0]);
            }}
            className="rounded-xs border border-dashed border-line-strong px-4 py-8 text-center"
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={buttonClass("ghost", "sm")}
            >
              {uploading ? "Uploading…" : "Choose an image"}
            </button>
            <p className="mt-3 text-xs text-faint">
              Or drop one here. JPEG, PNG, WebP, GIF, or AVIF, up to 10 MB.
            </p>
          </div>
        )}

        {errors.url ? (
          <p className="mt-2 text-xs text-flare-soft">{errors.url}</p>
        ) : null}
        <p role="status" className="mt-2 text-xs text-dust empty:hidden">
          {notice}
        </p>

        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </fieldset>
  );
}
