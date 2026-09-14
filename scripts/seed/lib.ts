import { readFileSync } from "node:fs";
import path from "node:path";

import { imageSize } from "image-size";

import type { ContentImage } from "@/db/schema";

// Seed commands run from the project root (npm run db:seed).
const root = process.cwd();

/** Reads a Markdown file from scripts/seed/content. */
export function content(file: string) {
  const text = readFileSync(
    path.join(root, "scripts/seed/content", file),
    "utf8",
  );
  return `${text.trim()}\n`;
}

/** An image in public/, with its pixel size read from the file. */
export function image(
  url: string,
  alt: string,
  caption?: string,
): ContentImage {
  const { width, height } = imageSize(
    readFileSync(path.join(root, "public", url)),
  );
  return { url, alt, ...(caption ? { caption } : {}), width, height };
}
