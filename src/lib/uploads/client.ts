import type { ContentImage } from "@/db/schema";

import { isImageType, MAX_IMAGE_BYTES, type UploadMode } from "./shared";

export type UploadedImage = Pick<ContentImage, "url" | "width" | "height">;

/** Reads an image's pixel size in the browser, so pages can reserve space. */
async function measure(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {};
  }
}

/** Makes a file name safe to use in a storage path. */
function safeName(name: string) {
  const cleaned = name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 60) || "image";
}

/** Uploads an image to wherever this environment stores them. */
export async function uploadImage(
  file: File,
  mode: UploadMode,
): Promise<UploadedImage> {
  if (!isImageType(file.type)) {
    throw new Error("Use a JPEG, PNG, WebP, GIF, or AVIF image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Images must be 10 MB or smaller.");
  }

  const size = await measure(file);

  if (mode === "blob") {
    // Loaded on demand, so local development never downloads it.
    const { upload } = await import("@vercel/blob/client");
    const blob = await upload(`uploads/${safeName(file.name)}`, file, {
      access: "public",
      handleUploadUrl: "/api/uploads/blob",
      contentType: file.type,
    });
    return { url: blob.url, ...size };
  }

  if (mode === "local") {
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/uploads/local", {
      method: "POST",
      body,
    });
    const result = (await response.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };
    if (!response.ok || !result.url) {
      throw new Error(result.error ?? "The upload failed. Please try again.");
    }
    return { url: result.url, ...size };
  }

  throw new Error(
    "Image uploads aren't set up here. Connect a Vercel Blob store to this project.",
  );
}

/** "my-screenshot_2.png" -> "my screenshot 2", a starting point for alt text. */
export function altFromFileName(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim() || "Image"
  );
}
