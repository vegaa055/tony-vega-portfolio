import { z } from "zod";

import { SLUG_PATTERN } from "@/lib/slug";

// Shared by the admin editors (for quick feedback) and the Server Actions,
// which always validate again: the server's check is the one that counts.

/** Site files (/images, /uploads) or images in the site's Vercel Blob store. */
export function isAllowedImageUrl(url: string) {
  if (url.startsWith("/images/") || url.startsWith("/uploads/")) {
    // Plain path characters only, and never a step up out of the folder.
    return /^[\w./-]+$/.test(url) && !url.split("/").includes("..");
  }
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

const text = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`);
const required = (max: number) => text(max).min(1, "This is required.");

export const imageSchema = z.object({
  url: z
    .string()
    .refine(isAllowedImageUrl, "Upload the image rather than linking to it."),
  alt: z
    .string()
    .trim()
    .min(1, "Describe the image for people who can't see it.")
    .max(300, "Keep this under 300 characters."),
  caption: text(300).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const slug = required(100).regex(
  SLUG_PATTERN,
  "Use lowercase letters, numbers, and single hyphens.",
);

/** A list of short labels, like tags or tools. */
const labels = (maxItems: number, maxLength: number) =>
  z
    .array(z.string().trim().min(1).max(maxLength))
    .max(maxItems, `Use ${maxItems} or fewer.`);

/** Empty string (no link) or an http(s) URL. */
const optionalUrl = z
  .union([
    z.literal(""),
    z.url({
      protocol: /^https?$/,
      message: "Enter a full address, starting with https://",
    }),
  ])
  .transform((value) => value || null);

/**
 * From a date input ("2026-09-14", or empty). Stored at noon UTC so the date
 * reads the same in every time zone.
 */
const publishDate = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .transform((value) => (value ? new Date(`${value}T12:00:00Z`) : null));

const status = z.enum(["draft", "published"]);

export const postInputSchema = z.object({
  title: required(200),
  slug,
  excerpt: text(500),
  body: z.string().max(200_000, "This post is too long to save."),
  coverImage: imageSchema.nullable(),
  tags: labels(12, 40),
  status,
  publishedAt: publishDate,
});

export const projectInputSchema = z.object({
  title: required(200),
  slug,
  tagline: text(280),
  summary: text(1000),
  body: z.string().max(200_000, "This write-up is too long to save."),
  coverImage: imageSchema.nullable(),
  gallery: z.array(imageSchema).max(30, "Use 30 images or fewer."),
  techStack: labels(16, 40),
  tags: labels(12, 40),
  repoUrl: optionalUrl,
  liveUrl: optionalUrl,
  featured: z.boolean(),
  status,
  publishedAt: publishDate,
});

export const aboutInputSchema = z.object({
  headline: text(280),
  bio: z.string().max(50_000, "This bio is too long to save."),
  portrait: imageSchema.nullable(),
  skills: z
    .array(z.object({ label: required(60), items: labels(40, 40) }))
    .max(12, "Use 12 groups or fewer."),
  experience: z
    .array(
      z.object({
        kind: z.enum(["work", "education"]),
        role: required(160),
        organization: required(200),
        period: text(60),
        description: text(1000),
      }),
    )
    .max(30, "Use 30 entries or fewer."),
});

/** What an editor sends (dates as strings). */
export type PostInput = z.input<typeof postInputSchema>;
export type ProjectInput = z.input<typeof projectInputSchema>;
export type AboutInput = z.input<typeof aboutInputSchema>;

/** What the database layer receives after validation. */
export type PostValues = z.output<typeof postInputSchema>;
export type ProjectValues = z.output<typeof projectInputSchema>;
export type AboutValues = z.output<typeof aboutInputSchema>;

/** Validation issues keyed by field path, e.g. "gallery.2.alt". */
export type FieldErrors = Record<string, string>;

/** The errors under one field, with the prefix removed ("gallery" -> "2.alt"). */
export function errorsAt(errors: FieldErrors, prefix: string): FieldErrors {
  const nested: FieldErrors = {};
  for (const [key, message] of Object.entries(errors)) {
    if (key === prefix) nested[""] = message;
    else if (key.startsWith(`${prefix}.`)) {
      nested[key.slice(prefix.length + 1)] = message;
    }
  }
  return nested;
}

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}
