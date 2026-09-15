import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The orbit mark from icon.svg, drawn edge to edge: iOS rounds the corners of
// home-screen icons itself.
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#05060a"/>
  <ellipse cx="16" cy="16" rx="12" ry="5.6" fill="none" stroke="#a2aabd" stroke-width="1.5" transform="rotate(-24 16 16)"/>
  <circle cx="16" cy="16" r="4.2" fill="#ff6a4d"/>
  <circle cx="24.35" cy="9.22" r="1.9" fill="#eceef5"/>
</svg>`;

/** The home-screen icon for iPhones and iPads (generated at build time). */
export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`}
      width={size.width}
      height={size.height}
      alt=""
    />,
    size,
  );
}
