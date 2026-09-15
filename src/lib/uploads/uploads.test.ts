import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { altFromFileName } from "./client";
import { isImageType } from "./shared";
import { hasImageSignature } from "./signature";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === "string"
        ? [...part].map((char) => char.charCodeAt(0))
        : part,
    ),
  );

const samples = {
  "image/jpeg": bytes([0xff, 0xd8, 0xff, 0xe0], "JFIF"),
  "image/png": bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]),
  "image/gif": bytes("GIF89a"),
  "image/webp": bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 "),
  "image/avif": bytes([0, 0, 0, 0x20], "ftypavif"),
} as const;

describe("hasImageSignature", () => {
  it.each(Object.entries(samples))("recognizes %s", (type, sample) => {
    expect(hasImageSignature(sample, type as keyof typeof samples)).toBe(true);
  });

  it("recognizes a real image from the site", () => {
    const file = readFileSync(
      "public/images/projects/3d-solar-system/cover.webp",
    );
    expect(hasImageSignature(new Uint8Array(file), "image/webp")).toBe(true);
  });

  it("rejects text renamed to look like an image", () => {
    const text = bytes("<script>alert(1)</script>");
    for (const type of Object.keys(samples) as (keyof typeof samples)[]) {
      expect(hasImageSignature(text, type)).toBe(false);
    }
  });

  it("rejects an image claiming to be a different type", () => {
    expect(hasImageSignature(samples["image/png"], "image/jpeg")).toBe(false);
  });

  it("rejects files too short to hold a signature", () => {
    expect(hasImageSignature(bytes([0xff]), "image/jpeg")).toBe(false);
    expect(hasImageSignature(new Uint8Array(), "image/webp")).toBe(false);
  });
});

describe("isImageType", () => {
  it("accepts the supported image types", () => {
    expect(isImageType("image/png")).toBe(true);
    expect(isImageType("image/avif")).toBe(true);
  });

  it.each(["image/svg+xml", "text/html", "", "toString", "__proto__"])(
    "rejects %j",
    (type) => {
      expect(isImageType(type)).toBe(false);
    },
  );
});

describe("altFromFileName", () => {
  it("turns a file name into a starting description", () => {
    expect(altFromFileName("my-screenshot_2.png")).toBe("my screenshot 2");
  });

  it("removes brackets that would break Markdown image syntax", () => {
    expect(altFromFileName("orbit_[diagram]-2.webp")).toBe("orbit diagram 2");
  });

  it("falls back to a generic description", () => {
    expect(altFromFileName(".png")).toBe("Image");
  });
});
