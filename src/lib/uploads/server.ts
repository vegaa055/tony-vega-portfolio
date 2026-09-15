import "server-only";

import type { UploadMode } from "./shared";

export function getUploadMode(): UploadMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  // Files written into public/ are only served by the dev server.
  if (process.env.NODE_ENV === "development") return "local";
  return "disabled";
}
