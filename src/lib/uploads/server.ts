import "server-only";

import path from "node:path";

import type { UploadMode } from "./shared";

export function getUploadMode(): UploadMode {
  // A connected Blob store: its id (Vercel's OIDC connection, the default) or
  // an older read-write token.
  if (process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN) {
    return "blob";
  }
  // Saving to disk works on your own machine: the dev server, or a production
  // build started with LOCAL_UPLOADS=true (the end-to-end tests do this).
  // It never works on Vercel, which is why production uses Blob.
  if (
    process.env.NODE_ENV === "development" ||
    process.env.LOCAL_UPLOADS === "true"
  ) {
    return "local";
  }
  return "disabled";
}

/**
 * Where local uploads are saved. Not public/: a production server only serves
 * files that were there when it was built, so app/uploads/[file] serves these.
 *
 * Paths into this folder carry a `turbopackIgnore` comment. Without it, the
 * build can't tell which files the path means, so it ships the whole project
 * with the server code. Uploads are made at runtime and never need shipping.
 */
export function localUploadDir() {
  return path.resolve(
    /* turbopackIgnore: true */ process.env.LOCAL_UPLOAD_DIR || ".uploads",
  );
}
