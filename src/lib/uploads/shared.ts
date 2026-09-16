/**
 * Where uploaded images go:
 * - "blob": Vercel Blob (wherever a Blob store is connected: BLOB_STORE_ID or
 *   BLOB_READ_WRITE_TOKEN is set)
 * - "local": the .uploads folder on your own machine (git-ignored)
 * - "disabled": a production build without a Blob store
 */
export type UploadMode = "blob" | "local" | "disabled";

/** Accepted image types, and the extension each is saved with. */
export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function isImageType(type: string): type is ImageType {
  return Object.hasOwn(IMAGE_TYPES, type);
}

export const IMAGE_ACCEPT = Object.keys(IMAGE_TYPES).join(",");
