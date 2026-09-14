import "server-only";

import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import type { Element, ElementContent, Root } from "hast";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import type { Route } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";

import { getHighlighter } from "./highlighter";

/** A section heading, for the "Contents" list beside long pages. */
export type Heading = {
  id: string;
  text: string;
};

/**
 * A paragraph holding nothing but an image becomes a <figure>. The image's
 * Markdown title, as in ![alt](src "caption"), becomes the caption.
 */
function rehypeFigures() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "p" || !parent || index === undefined) return;

      const content = node.children.filter(
        (child) => !(child.type === "text" && child.value.trim() === ""),
      );
      const [image] = content;
      if (
        content.length !== 1 ||
        image.type !== "element" ||
        image.tagName !== "img"
      ) {
        return;
      }

      const caption = image.properties.title;
      delete image.properties.title;

      const children: ElementContent[] = [image];
      if (typeof caption === "string" && caption) {
        children.push({
          type: "element",
          tagName: "figcaption",
          properties: {},
          children: [{ type: "text", value: caption }],
        });
      }

      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: {},
        children,
      };
      parent.children[index] = figure;
      return SKIP;
    });
  };
}

function isHeadingAnchor(node: ElementContent) {
  return (
    node.type === "element" &&
    Array.isArray(node.properties.className) &&
    node.properties.className.includes("heading-anchor")
  );
}

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type !== "element" || isHeadingAnchor(node)) return "";
  return node.children.map(textOf).join("");
}

function collectHeadings(tree: Root) {
  const headings: Heading[] = [];
  visit(tree, "element", (node) => {
    if (node.tagName === "h2" && typeof node.properties.id === "string") {
      headings.push({ id: node.properties.id, text: textOf(node).trim() });
    }
  });
  return headings;
}

// The plugin's types expect the full bundled highlighter; the core highlighter
// used here has the same API with only the languages this site needs.
type ShikiHighlighter = Parameters<typeof rehypeShikiFromHighlighter>[0];

async function buildProcessor() {
  const highlighter = (await getHighlighter()) as unknown as ShikiHighlighter;

  return (
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      // Raw HTML inside Markdown is dropped here (allowDangerousHtml stays off).
      .use(remarkRehype)
      // Remove anything unsafe (e.g. javascript: links) before the plugins
      // below add their own trusted markup.
      .use(rehypeSanitize)
      .use(rehypeFigures)
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: "append",
        test: ["h2", "h3"],
        // A convenience for copying section links; hidden from assistive tech
        // so headings are announced by their text alone.
        properties: {
          className: ["heading-anchor"],
          ariaHidden: "true",
          tabIndex: -1,
        },
        content: { type: "text", value: "#" },
      })
      .use(rehypeShikiFromHighlighter, highlighter, {
        theme: "deep-field-code",
        defaultLanguage: "text",
        fallbackLanguage: "text",
        transformers: [
          {
            pre(node) {
              const { lang } = this.options;
              if (lang && lang !== "text") {
                node.properties["data-language"] = lang;
              }
            },
          },
        ],
      })
      .freeze()
  );
}

let processor: ReturnType<typeof buildProcessor> | undefined;

function getProcessor() {
  processor ??= buildProcessor().catch((error: unknown) => {
    // Don't cache a failed setup; the next render retries.
    processor = undefined;
    throw error;
  });
  return processor;
}

const components: Partial<Components> = {
  // The page title is the only <h1>; demote any that appear in the body.
  h1: (props) => <h2 {...props} />,
  a: ({ href = "", children, ...props }) => {
    if (href.startsWith("/") && !href.startsWith("//")) {
      return (
        <Link href={href as Route} {...props}>
          {children}
        </Link>
      );
    }
    if (/^https?:\/\//.test(href)) {
      return (
        <a href={href} target="_blank" rel="noreferrer" {...props}>
          {children}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      );
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
  img: ({ alt = "", ...props }) => (
    // Markdown images have no known dimensions, so next/image can't size them.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} loading="lazy" decoding="async" {...props} />
  ),
  table: (props) => (
    <div className="table-scroll">
      <table {...props} />
    </div>
  ),
};

/**
 * Renders Markdown to React elements, plus the list of section headings.
 * Cached by the Markdown text itself, so each version is processed once.
 */
export async function renderMarkdown(source: string) {
  "use cache";
  cacheLife("max");

  const markdown = await getProcessor();
  const tree = (await markdown.run(markdown.parse(source))) as Root;

  return {
    content: toJsxRuntime(tree, { Fragment, jsx, jsxs, components }),
    headings: collectHeadings(tree),
  };
}
