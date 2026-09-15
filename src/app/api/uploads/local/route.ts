import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/lib/auth";
import { getUploadMode, localUploadDir } from "@/lib/uploads/server";
import {
  IMAGE_TYPES,
  isImageType,
  MAX_IMAGE_BYTES,
} from "@/lib/uploads/shared";
import { hasImageSignature } from "@/lib/uploads/signature";

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

/**
 * Image uploads saved to disk when running locally (see getUploadMode).
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
  const folder = localUploadDir();
  await mkdir(folder, { recursive: true });
  // See localUploadDir about the comment.
  await writeFile(path.join(/* turbopackIgnore: true */ folder, name), bytes);

  return Response.json({ url: `/uploads/${name}` });
}
