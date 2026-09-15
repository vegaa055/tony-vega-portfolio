export type FeedItem = {
  title: string;
  /** The item's full address. */
  url: string;
  description: string;
  publishedAt: Date;
  updatedAt: Date;
  categories: string[];
};

export type Feed = {
  title: string;
  description: string;
  /** The full address of the page the feed follows. */
  siteUrl: string;
  /** The feed's own full address. */
  feedUrl: string;
  /** Newest first. */
  items: FeedItem[];
};

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/**
 * Text that's safe inside XML: markup characters escaped, and characters XML
 * doesn't allow at all (most control characters) removed, since a single one
 * makes feed readers reject the whole feed.
 */
export function escapeXml(text: string) {
  return text
    .replace(/[^\t\n\r -퟿-�\u{10000}-\u{10FFFF}]/gu, "")
    .replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

/** A feed as RSS 2.0. */
export function renderRss(feed: Feed) {
  const text = (tag: string, value: string) =>
    `<${tag}>${escapeXml(value)}</${tag}>`;

  const lastUpdate =
    feed.items.length > 0
      ? new Date(
          Math.max(...feed.items.map((item) => item.updatedAt.getTime())),
        )
      : null;

  const items = feed.items.map((item) =>
    [
      "<item>",
      text("title", item.title),
      text("link", item.url),
      `<guid isPermaLink="true">${escapeXml(item.url)}</guid>`,
      // RSS dates use the RFC 822 format: "Mon, 14 Sep 2026 12:00:00 GMT".
      text("pubDate", item.publishedAt.toUTCString()),
      item.description ? text("description", item.description) : "",
      ...item.categories.map((category) => text("category", category)),
      "</item>",
    ]
      .filter(Boolean)
      .join(""),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    text("title", feed.title),
    text("link", feed.siteUrl),
    text("description", feed.description),
    text("language", "en-us"),
    lastUpdate ? text("lastBuildDate", lastUpdate.toUTCString()) : "",
    `<atom:link href="${escapeXml(feed.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "</channel>",
    "</rss>",
  ]
    .filter(Boolean)
    .join("\n");
}
