import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import sharp from "sharp";

import { siteConfig } from "@/config/site";
import { localUploadDir } from "@/lib/uploads/server";
import { isAllowedImageUrl } from "@/lib/validation";

/** The standard share-image size, used by every card. */
export const OG_SIZE = { width: 1200, height: 630 };

// Layout, left to right: margin, text, gap, image area, margin.
const MARGIN = { left: 72, right: 64 };
/** The largest an image is drawn. */
const IMAGE_BOX = { width: 480, height: 400 };
const TEXT_WIDTH =
  OG_SIZE.width - MARGIN.left - MARGIN.right - IMAGE_BOX.width - 40;

const colors = {
  void: "#05060a",
  line: "#1c2130",
  lineStrong: "#2a3144",
  star: "#eceef5",
  dust: "#a2aabd",
  faint: "#778098",
  flare: "#ff6a4d",
};

const svg = (markup: string) =>
  `data:image/svg+xml;base64,${Buffer.from(markup).toString("base64")}`;

// The orbit mark from app/icon.svg, without its background square.
const MARK = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <ellipse cx="16" cy="16" rx="12" ry="5.6" fill="none" stroke="${colors.dust}" stroke-width="1.5" transform="rotate(-24 16 16)"/>
    <circle cx="16" cy="16" r="4.2" fill="${colors.flare}"/>
    <circle cx="24.35" cy="9.22" r="1.9" fill="${colors.star}"/>
  </svg>`,
);

// A large, faint orbit for cards without an image, echoing the home page hero.
const ORBIT = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520">
    <g transform="rotate(-24 260 260)" fill="none">
      <ellipse cx="260" cy="260" rx="250" ry="116" stroke="${colors.lineStrong}" stroke-width="1.5"/>
      <ellipse cx="260" cy="260" rx="170" ry="79" stroke="${colors.line}" stroke-width="1.5"/>
    </g>
    <circle cx="260" cy="260" r="30" fill="${colors.flare}" opacity="0.9"/>
    <circle cx="260" cy="260" r="58" fill="${colors.flare}" opacity="0.08"/>
    <circle cx="434" cy="119" r="12" fill="${colors.star}"/>
    <circle cx="118" cy="323" r="7" fill="${colors.dust}"/>
  </svg>`,
);

// A fixed scatter of stars, so every card shares the same sky.
const STARS = [
  [612, 58, 2, 0.5],
  [944, 102, 1.5, 0.35],
  [1106, 214, 2, 0.55],
  [818, 286, 1, 0.4],
  [1152, 402, 1.5, 0.3],
  [702, 470, 1, 0.35],
  [1010, 548, 2, 0.45],
  [540, 574, 1, 0.3],
  [388, 36, 1, 0.25],
  [1068, 36, 1, 0.4],
] as const;

type CardOptions = {
  /** A short line above the title, like "Project · 2026". */
  kicker: string;
  title: string;
  /** Mono for page and project titles; sans for post titles, like the site. */
  titleFont?: "mono" | "sans";
  description?: string;
  /** A site image for the right side, like a project's cover. */
  imageUrl?: string;
};

/**
 * A share image in the site's style, as a PNG response.
 *
 * Drawing is cached by the card's content, so each version is drawn once and
 * cards can be built ahead of time with the pages.
 */
export async function renderCard(options: CardOptions) {
  const png = await drawCard(options);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
}

async function drawCard({
  kicker,
  title,
  titleFont = "mono",
  description,
  imageUrl,
}: CardOptions) {
  "use cache";
  cacheLife("max");

  const [fonts, image] = await Promise.all([
    loadFonts(),
    imageForCard(imageUrl),
  ]);
  const host = new URL(siteConfig.url).host;

  const response = new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: colors.void,
        color: colors.star,
      }}
    >
      {STARS.map(([x, y, size, opacity]) => (
        <div
          key={`${x}-${y}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            backgroundColor: colors.star,
            opacity,
          }}
        />
      ))}

      {/* Right side: the image, or a faint orbit. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: MARGIN.right,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: IMAGE_BOX.width,
        }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            width={image.width}
            height={image.height}
            alt=""
            style={{ border: `1px solid ${colors.lineStrong}` }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ORBIT} width={420} height={420} alt="" />
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: MARGIN.left + TEXT_WIDTH,
          padding: `64px 0 64px ${MARGIN.left}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} width={46} height={46} alt="" />
          <span
            style={{
              fontFamily: "Martian Mono",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {siteConfig.name}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "Martian Mono",
              fontSize: 20,
              letterSpacing: 3.5,
              textTransform: "uppercase",
              color: colors.flare,
            }}
          >
            {kicker}
          </span>
          {/* Line clamping only works on block elements. */}
          <span
            style={{
              display: "block",
              marginTop: 22,
              fontFamily:
                titleFont === "mono" ? "Martian Mono" : "Instrument Sans",
              fontWeight: titleFont === "mono" ? 300 : 500,
              fontSize: titleSize(title, titleFont),
              lineHeight: 1.08,
              letterSpacing: titleFont === "mono" ? -1.5 : -0.5,
              lineClamp: 3,
            }}
          >
            {title}
          </span>
          {description ? (
            <span
              style={{
                display: "block",
                marginTop: 24,
                fontFamily: "Instrument Sans",
                fontSize: 26,
                lineHeight: 1.4,
                color: colors.dust,
                lineClamp: 3,
              }}
            >
              {description}
            </span>
          ) : null}
        </div>

        <span
          style={{
            fontFamily: "Martian Mono",
            fontSize: 18,
            letterSpacing: 2.5,
            color: colors.faint,
          }}
        >
          {host}
        </span>
      </div>

      {/* The accent line along the bottom edge. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: 240,
          height: 4,
          backgroundColor: colors.flare,
        }}
      />
    </div>,
    { ...OG_SIZE, fonts },
  );

  return new Uint8Array(await response.arrayBuffer());
}

/**
 * The largest title size that fits on two lines, or failing that on three.
 * Longer titles are cut off after three lines.
 */
function titleSize(title: string, font: "mono" | "sans") {
  // An average letter's width in ems (mono letters are wider), with some room
  // for lines that break early.
  const ems = title.length * (font === "mono" ? 0.66 : 0.5) * 1.15;
  const lines = (size: number) => Math.ceil((ems * size) / TEXT_WIDTH);
  return (
    [76, 60, 50].find((size) => lines(size) <= 2) ??
    [60, 50].find((size) => lines(size) <= 3) ??
    42
  );
}

/**
 * Font files for the cards, from assets/fonts (SIL Open Font License). The
 * folder is named in full, so the build ships it with the server code.
 */
async function loadFonts() {
  const file = (name: string) =>
    readFile(path.join(process.cwd(), "assets/fonts", name));
  const [monoLight, mono, sans, sansMedium] = await Promise.all([
    file("martian-mono-latin-300-normal.woff"),
    file("martian-mono-latin-400-normal.woff"),
    file("instrument-sans-latin-400-normal.woff"),
    file("instrument-sans-latin-500-normal.woff"),
  ]);
  return [
    { name: "Martian Mono", data: monoLight, weight: 300 as const },
    { name: "Martian Mono", data: mono, weight: 400 as const },
    { name: "Instrument Sans", data: sans, weight: 400 as const },
    { name: "Instrument Sans", data: sansMedium, weight: 500 as const },
  ];
}

/**
 * A site image for a card: scaled to fit the image area, whole and uncropped
 * (covers often include their own lettering), and converted to JPEG, since
 * the renderer can't draw WebP or AVIF. Null if there's no usable image.
 */
async function imageForCard(url: string | undefined) {
  if (!url) return null;
  try {
    const bytes = await readSiteImage(url);
    if (!bytes) return null;
    const { data, info } = await sharp(bytes)
      .resize(IMAGE_BOX.width, IMAGE_BOX.height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return {
      src: `data:image/jpeg;base64,${data.toString("base64")}`,
      width: info.width,
      height: info.height,
    };
  } catch {
    // Missing, unreachable, or not an image: the card goes without it.
    return null;
  }
}

/** The original bytes of a site image, or null if its address isn't allowed. */
async function readSiteImage(url: string) {
  if (!isAllowedImageUrl(url)) return null;

  if (url.startsWith("/uploads/")) {
    // Saved to disk by the dev server or the end-to-end tests.
    return readInside(localUploadDir(), url.slice("/uploads/".length));
  }
  if (url.startsWith("/images/")) {
    // The folder is named in full, so the build ships public/images with this
    // code, and cards redrawn on Vercel after an edit can still read them.
    const root = path.join(process.cwd(), "public/images");
    return readInside(root, url.slice("/images/".length));
  }
  // Uploaded to Vercel Blob.
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  return response.ok ? Buffer.from(await response.arrayBuffer()) : null;
}

async function readInside(root: string, name: string) {
  // The comment stops the build from shipping every file this could read
  // (see localUploadDir).
  const file = path.resolve(/* turbopackIgnore: true */ root, name);
  // Never read outside the folder.
  if (!file.startsWith(root + path.sep)) return null;
  return readFile(file);
}
