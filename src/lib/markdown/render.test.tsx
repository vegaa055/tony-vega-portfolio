import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { renderMarkdown } from "./render";

// Next.js-only helpers: caching does nothing here, and internal links render
// as plain anchors.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));
vi.mock("next/link", () => ({
  default: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} data-internal="" {...props} />
  ),
}));

async function render(markdown: string) {
  const { content, headings } = await renderMarkdown(markdown);
  return { html: renderToStaticMarkup(<>{content}</>), headings };
}

describe("renderMarkdown safety", () => {
  it("drops raw HTML, including scripts", async () => {
    const { html } = await render("<script>alert(1)</script>\n\nHello");
    expect(html).not.toContain("<script");
    expect(html).toContain("Hello");
  });

  it("drops inline HTML with event handlers", async () => {
    const { html } = await render('Look <img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<img");
  });

  it("removes javascript: links but keeps their text", async () => {
    const { html } = await render("[click me](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("click me");
  });
});

describe("renderMarkdown output", () => {
  it("opens external links in a new tab and says so", async () => {
    const { html } = await render("[Example](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain("(opens in a new tab)");
  });

  it("sends internal links through Next.js links", async () => {
    const { html } = await render("[About](/about)");
    expect(html).toMatch(/<a href="\/about" data-internal="">About<\/a>/);
  });

  it("demotes # headings, since the page title is the only h1", async () => {
    const { html } = await render("# Big title");
    expect(html).not.toContain("<h1");
    expect(html).toContain("<h2");
  });

  it("gives sections ids and lists them for the contents", async () => {
    const { html, headings } = await render(
      "## First section\n\ntext\n\n## Second\n\n### Not listed",
    );
    expect(headings).toEqual([
      { id: "first-section", text: "First section" },
      { id: "second", text: "Second" },
    ]);
    expect(html).toContain('id="first-section"');
    expect(html).toMatch(/<a[^>]*aria-hidden="true"[^>]*>#<\/a>/);
  });

  it("highlights code and labels its language", async () => {
    const { html } = await render("```ts\nconst answer: number = 42;\n```");
    expect(html).toContain('class="shiki');
    expect(html).toContain('data-language="ts"');
    expect(html).toContain("answer");
  });

  it("turns an image on its own line into a figure with a caption", async () => {
    const { html } = await render(
      '![A 3D orbit](/uploads/orbit.webp "The inner planets")',
    );
    expect(html).toContain("<figure>");
    expect(html).toContain('alt="A 3D orbit"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain("<figcaption>The inner planets</figcaption>");
  });

  it("wraps tables so they can scroll on small screens", async () => {
    const { html } = await render("| A | B |\n| - | - |\n| 1 | 2 |");
    expect(html).toContain('<div class="table-scroll"><table>');
  });

  it("makes the first column row headers when the top-left cell is empty", async () => {
    const { html } = await render(
      "| | Simulation | Actual |\n| - | - | - |\n| Mars orbital period | 686.99 days | 686.98 days |",
    );
    expect(html).toMatch(/<td><\/td>\s*<th>Simulation<\/th>/);
    expect(html).toMatch(
      /<th scope="row">Mars orbital period<\/th>\s*<td>686.99 days<\/td>/,
    );
  });

  it("leaves other tables' first column as regular cells", async () => {
    const { html } = await render(
      "| Pair | Score |\n| - | - |\n| Greek ↔ Japanese | 14% |",
    );
    expect(html).not.toContain("scope=");
    expect(html).toContain("<td>Greek ↔ Japanese</td>");
  });
});
