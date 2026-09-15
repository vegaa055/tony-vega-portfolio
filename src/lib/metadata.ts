import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

/** The blog's RSS feed. */
export const feed = {
  path: "/feed.xml",
  title: `${siteConfig.name} · Blog`,
};

type PageMetadataOptions = {
  /** The page's own path, like "/blog/hello-world". */
  path: string;
  /** Leave out to keep the site's default title (the home page). */
  title?: string;
  /** Leave out to keep the site's description. */
  description?: string;
  /** Projects and posts are articles; other pages are websites. */
  article?: { publishedTime: Date | null };
};

/**
 * Metadata for a public page: title, description, canonical address, feed
 * link, and the Open Graph fields that social previews use.
 *
 * Next.js replaces a layout's `openGraph` and `alternates` when a page sets
 * its own (it doesn't merge them), so this builds the full set every time.
 * Share images come from the opengraph-image.tsx beside each page.
 */
export function pageMetadata({
  path,
  title,
  description,
  article,
}: PageMetadataOptions): Metadata {
  const openGraph = {
    title,
    description,
    url: path,
    siteName: siteConfig.name,
    locale: "en_US",
  };

  return {
    // A title or description set to undefined would clear the site's default,
    // so only include the ones given.
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: path,
      types: {
        "application/rss+xml": [{ url: feed.path, title: feed.title }],
      },
    },
    openGraph: article
      ? {
          ...openGraph,
          type: "article",
          publishedTime: article.publishedTime?.toISOString(),
        }
      : { ...openGraph, type: "website" },
  };
}
