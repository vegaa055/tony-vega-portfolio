import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";

import { auth } from "@/lib/auth";
import { getUploadMode } from "@/lib/uploads/server";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/uploads/shared";

/** How long an upload link stays valid. */
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;

class SignedOutError extends Error {}

/**
 * Hands the browser a short-lived presigned link to upload one image straight
 * to Vercel Blob (so the file never passes through a function), but only for
 * a signed-in admin, and only for images. It authenticates to Blob with
 * Vercel's rotating OIDC credentials, so no long-lived Blob secret is needed.
 */
export async function POST(request: Request) {
  if (getUploadMode() !== "blob") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as HandleUploadPresignedBody;
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) throw new SignedOutError("Sign in to upload images.");

        const limits = {
          allowedContentTypes: Object.keys(IMAGE_TYPES),
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          validUntil: Date.now() + UPLOAD_WINDOW_MS,
        };
        return {
          // Only this pathname, only uploads, only images.
          token: await issueSignedToken({
            ...limits,
            pathname,
            operations: ["put"],
          }),
          urlOptions: {
            ...limits,
            addRandomSuffix: true,
            allowOverwrite: false,
          },
        };
      },
      // No onUploadCompleted: the editor stores the URL itself when it saves.
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: error instanceof SignedOutError ? 401 : 400 },
    );
  }
}
