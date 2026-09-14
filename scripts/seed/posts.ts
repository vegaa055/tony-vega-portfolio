import type { NewPost } from "@/db/schema";

export type PostSeed = Omit<NewPost, "body"> & {
  /** Markdown file in scripts/seed/content/posts. */
  bodyFile: string;
  /** Tag names; tags are created as needed. */
  tags: string[];
};

export const postSeeds: PostSeed[] = [
  {
    slug: "rebuilding-my-portfolio",
    title: "Rebuilding my portfolio from scratch",
    excerpt:
      "Why I rebuilt this site with Next.js 16 and Postgres, how pages stay fast while the database sleeps, and why I'm building my own admin panel instead of adding a CMS.",
    bodyFile: "posts/rebuilding-my-portfolio.md",
    tags: ["Building", "Web"],
    status: "published",
    publishedAt: new Date("2026-09-14T12:00:00Z"),
  },
  {
    // From the Flask portfolio, where it was a placeholder. Kept as a draft.
    slug: "why-i-keep-rebuilding",
    title: "Why I keep rebuilding",
    excerpt: "On learning by doing, and doing again.",
    bodyFile: "posts/why-i-keep-rebuilding.md",
    tags: ["Essays", "Building"],
    status: "draft",
  },
];
