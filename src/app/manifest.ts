import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** Name, colors, and icons for "Add to Home Screen" and browser tabs. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "browser",
    background_color: "#05060a",
    theme_color: "#05060a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
