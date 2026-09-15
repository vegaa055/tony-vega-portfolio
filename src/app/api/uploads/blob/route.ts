import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { auth } from "@/lib/auth";
import { getUploadMode } from "@/lib/uploads/server";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/uploads/shared";

/**
 * Issues short-lived tokens so the browser can upload images straight to
 * Vercel Blob (no size limit from passing through a function), but only for a
 * signed-in admin, and only for images.
 */
export async function POST(request: Request) {
  if (getUploadMode() !== "blob") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) throw new Error("Sign in to upload images.");

        return {
          allowedContentTypes: Object.keys(IMAGE_TYPES),
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
      // The editor stores the URL itself when it saves; nothing to do here.
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
