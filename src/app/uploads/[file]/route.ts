import { readFile } from "node:fs/promises";
import path from "node:path";

import { getUploadMode, localUploadDir } from "@/lib/uploads/server";
import { IMAGE_TYPES } from "@/lib/uploads/shared";

const CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(IMAGE_TYPES).map(([type, extension]) => [extension, type]),
);

// The upload route names every file: a random UUID and an image extension.
const FILE_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif|avif)$/;

const notFound = () => new Response("Not found.", { status: 404 });

/** Serves images uploaded locally. With Vercel Blob, uploads have their own URLs. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/uploads/[file]">,
) {
  const { file } = await params;
  const match = FILE_NAME.exec(file);
  if (getUploadMode() !== "local" || !match) return notFound();

  try {
    // See localUploadDir about the comment.
    const bytes = await readFile(
      path.join(/* turbopackIgnore: true */ localUploadDir(), file),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": CONTENT_TYPES[match[1]],
        // A file name is never reused, so its contents never change.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound();
  }
}
