import { presignUrl, type IssuedSignedToken } from "@vercel/blob";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/uploads/shared";

import { POST } from "./route";

// Blob's API and the session check are stand-ins here; everything else, like
// building the presigned upload, is the real SDK. The real Blob path can only
// run on Vercel, where the OIDC credentials exist.
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  issueSignedToken: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@vercel/blob", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vercel/blob")>()),
  issueSignedToken: mocks.issueSignedToken,
}));

/** A token shaped like the ones Blob's API issues, for the given scope. */
function fakeSignedToken(scope: Record<string, unknown>): IssuedSignedToken {
  const validUntil = Date.now() + 60_000;
  const payload = Buffer.from(
    JSON.stringify({ storeId: "abc123", validUntil, ...scope }),
  ).toString("base64url");
  return {
    delegationToken: `${payload}.signature`,
    clientSigningToken: "test-signing-key",
    validUntil,
  };
}

const requestUpload = (pathname = "uploads/photo.png") =>
  POST(
    new Request("https://example.test/api/uploads/blob", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-presigned-url",
        payload: { pathname, clientPayload: null, multipart: false },
      }),
    }),
  );

beforeEach(() => {
  vi.stubEnv("BLOB_STORE_ID", "store_abc123");
  vi.stubEnv("BLOB_WEBHOOK_PUBLIC_KEY", "test-public-key");
  mocks.issueSignedToken.mockImplementation(async (options) =>
    fakeSignedToken(options),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/uploads/blob", () => {
  it("refuses visitors who aren't signed in, before asking Blob for anything", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await requestUpload();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Sign in to upload images.",
    });
    expect(mocks.issueSignedToken).not.toHaveBeenCalled();
  });

  it("gives the admin a link for one image, up to the size limit", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "admin" } });

    const response = await requestUpload("uploads/photo.png");

    expect(response.status).toBe(200);
    expect(mocks.issueSignedToken).toHaveBeenCalledWith({
      pathname: "uploads/photo.png",
      operations: ["put"],
      allowedContentTypes: Object.keys(IMAGE_TYPES),
      maximumSizeInBytes: MAX_IMAGE_BYTES,
      validUntil: expect.any(Number),
    });
    const { type, presignedUrlPayload } = await response.json();
    expect(type).toBe("blob.generate-presigned-url");
    expect(presignedUrlPayload.params).toMatchObject({
      "vercel-blob-allowed-content-types": Object.keys(IMAGE_TYPES)
        .sort()
        .join(","),
      "vercel-blob-maximum-size-in-bytes": String(MAX_IMAGE_BYTES),
      "vercel-blob-add-random-suffix": "true",
      "vercel-blob-allow-overwrite": "false",
    });
    // No completion callback: the editor saves the URL itself.
    expect(presignedUrlPayload.params).not.toHaveProperty(
      "vercel-blob-callback-url",
    );
  });

  it("is off when no Blob store is connected", async () => {
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");

    const response = await requestUpload();

    expect(response.status).toBe(404);
    expect(mocks.getSession).not.toHaveBeenCalled();
  });
});

describe("presigned uploads", () => {
  it("go to the host the Content-Security-Policy allows (https://vercel.com)", async () => {
    const { presignedUrl } = await presignUrl(
      fakeSignedToken({ pathname: "uploads/photo.png", operations: ["put"] }),
      { operation: "put", pathname: "uploads/photo.png", access: "public" },
    );
    expect(new URL(presignedUrl).origin).toBe("https://vercel.com");
  });
});
