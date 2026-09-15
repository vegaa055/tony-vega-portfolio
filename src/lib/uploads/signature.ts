import type { ImageType } from "./shared";

/**
 * Checks a file's first bytes against its claimed type, so a renamed
 * non-image (say, a script saved as photo.png) is rejected.
 */
export function hasImageSignature(bytes: Uint8Array, type: ImageType) {
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
