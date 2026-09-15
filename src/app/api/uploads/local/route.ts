import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/lib/auth";
import { getUploadMode } from "@/lib/uploads/server";
import {
  IMAGE_TYPES,
  isImageType,
  MAX_IMAGE_BYTES,
  type ImageType,
} from "@/lib/uploads/shared";

/** Checks the file's first bytes, so a renamed non-image is rejected. */
function hasImageSignature(bytes: Uint8Array, type: ImageType) {
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...bytes.subarray(from, to));

  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes[0] === 0x89 && ascii(1, 4) === "PNG";
    case "image/gif":
      return ascii(0, 4) === "GIF8";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif":
      return ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12));
  }
}

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

/**
 * Development-only image uploads, saved to public/uploads (git-ignored).
 * Production uploads go straight from the browser to Vercel Blob instead.
 */
export async function POST(request: Request) {
  if (getUploadMode() !== "local") return error("Not found.", 404);

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return error("Sign in to upload images.", 401);

  // Cookies alone don't prove the request came from this site.
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return error("Forbidden.", 403);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return error("No file was sent.", 400);
  if (!isImageType(file.type)) {
    return error("Use a JPEG, PNG, WebP, GIF, or AVIF image.", 415);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return error("Images must be 10 MB or smaller.", 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasImageSignature(bytes, file.type)) {
    return error("That file isn't a valid image.", 415);
  }

  // A random name: nothing from the client ends up in the path.
  const name = `${randomUUID()}.${IMAGE_TYPES[file.type]}`;
  const folder = path.join(process.cwd(), "public", "uploads");
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, name), bytes);

  return Response.json({ url: `/uploads/${name}` });
}
