import { describe, expect, it } from "vitest";

import { pageMetadata } from "./metadata";

describe("pageMetadata", () => {
  it("sets the canonical address and the feed link", () => {
    expect(pageMetadata({ path: "/projects" }).alternates).toEqual({
      canonical: "/projects",
      types: {
        "application/rss+xml": [
          { url: "/feed.xml", title: "Tony Vega · Blog" },
        ],
      },
    });
  });

  it("keeps the layout's title and description when a page has none", () => {
    // Setting either to undefined would clear the layout's value.
    const metadata = pageMetadata({ path: "/", description: "" });
    expect(metadata).not.toHaveProperty("title");
    expect(metadata).not.toHaveProperty("description");
  });

  it("marks projects and posts as articles, with their publish date", () => {
    const metadata = pageMetadata({
      path: "/blog/hello",
      title: "Hello",
      description: "A first post.",
      article: { publishedTime: new Date("2026-09-14T12:00:00Z") },
    });
    expect(metadata.title).toBe("Hello");
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      title: "Hello",
      description: "A first post.",
      url: "/blog/hello",
      siteName: "Tony Vega",
      publishedTime: "2026-09-14T12:00:00.000Z",
    });
  });

  it("marks other pages as websites", () => {
    expect(pageMetadata({ path: "/about" }).openGraph).toMatchObject({
      type: "website",
      url: "/about",
    });
  });
});
