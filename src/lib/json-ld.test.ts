import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import type { PostDetail } from "@/data/posts";
import type { ProjectDetail } from "@/data/projects";

import {
  blogPostingJsonLd,
  profilePageJsonLd,
  projectJsonLd,
  serializeJsonLd,
} from "./json-ld";

const site = (path: string) => new URL(path, siteConfig.url).href;

/** What search engines read: the JSON, without undefined fields. */
const asJson = (data: object) => JSON.parse(serializeJsonLd(data));

const post: PostDetail = {
  slug: "hello",
  title: "Hello",
  excerpt: "",
  body: "Text.",
  coverImage: null,
  publishedAt: new Date("2026-09-14T12:00:00Z"),
  updatedAt: new Date("2026-09-20T08:30:00Z"),
  readingMinutes: 1,
  tags: [],
};

const project: ProjectDetail = {
  slug: "orbit",
  title: "Orbit",
  tagline: "A tiny planet.",
  summary: "",
  body: "",
  coverImage: {
    url: "https://abc123.public.blob.vercel-storage.com/uploads/cover.png",
    alt: "Cover",
  },
  gallery: [],
  techStack: ["TypeScript", "Three.js"],
  tags: [{ name: "Simulation", slug: "simulation" }],
  repoUrl: null,
  liveUrl: null,
  featured: false,
  publishedAt: null,
  updatedAt: new Date("2026-09-20T08:30:00Z"),
};

describe("serializeJsonLd", () => {
  it("can't end its <script> tag early, and still reads back the same", () => {
    const data = { headline: "</script><script>alert(1)</script>" };
    const json = serializeJsonLd(data);
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual(data);
  });
});

describe("blogPostingJsonLd", () => {
  it("describes the post with full addresses and dates", () => {
    const json = asJson(
      blogPostingJsonLd({
        ...post,
        excerpt: "A first post.",
        coverImage: { url: "/images/blog/hello.png", alt: "Hello" },
        tags: [
          { name: "Next.js", slug: "nextjs" },
          { name: "Postgres", slug: "postgres" },
        ],
      }),
    );
    expect(json).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "Hello",
      description: "A first post.",
      url: site("/blog/hello"),
      image: site("/images/blog/hello.png"),
      datePublished: "2026-09-14T12:00:00.000Z",
      dateModified: "2026-09-20T08:30:00.000Z",
      keywords: "Next.js, Postgres",
      author: { "@type": "Person", name: siteConfig.name },
    });
  });

  it("leaves out what the post doesn't have", () => {
    const json = asJson(blogPostingJsonLd(post));
    expect(json).not.toHaveProperty("description");
    expect(json).not.toHaveProperty("image");
    expect(json).not.toHaveProperty("keywords");
  });
});

describe("projectJsonLd", () => {
  it("keeps uploaded images' addresses and lists the tools and tags", () => {
    const json = asJson(projectJsonLd(project));
    expect(json).toMatchObject({
      "@type": "SoftwareSourceCode",
      name: "Orbit",
      description: "A tiny planet.",
      url: site("/projects/orbit"),
      image: "https://abc123.public.blob.vercel-storage.com/uploads/cover.png",
      keywords: "TypeScript, Three.js, Simulation",
    });
    expect(json).not.toHaveProperty("codeRepository");
    expect(json).not.toHaveProperty("datePublished");
  });

  it("links the source code when there is some", () => {
    const json = asJson(
      projectJsonLd({ ...project, repoUrl: "https://github.com/me/orbit" }),
    );
    expect(json.codeRepository).toBe("https://github.com/me/orbit");
  });
});

describe("profilePageJsonLd", () => {
  it("describes Tony, with the portrait and social profiles", () => {
    const json = asJson(
      profilePageJsonLd({
        headline: "Software developer.",
        portrait: { url: "/images/about/portrait.webp", alt: "Portrait" },
        updatedAt: new Date("2026-09-20T08:30:00Z"),
      }),
    );
    expect(json).toMatchObject({
      "@type": "ProfilePage",
      url: site("/about"),
      mainEntity: {
        "@type": "Person",
        name: siteConfig.name,
        description: "Software developer.",
        image: site("/images/about/portrait.webp"),
        sameAs: [siteConfig.links.github, siteConfig.links.linkedin],
      },
    });
  });
});
