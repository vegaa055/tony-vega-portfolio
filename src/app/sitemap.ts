import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getAboutPage } from "@/data/about";
import { getPublishedPosts } from "@/data/posts";
import { getPublishedProjects } from "@/data/projects";

/** Every public page, for search engines. Drafts are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, about] = await Promise.all([
    getPublishedProjects(),
    getPublishedPosts(),
    getAboutPage(),
  ]);

  const url = (path: string) => new URL(path, siteConfig.url).href;

  return [
    // The home page shows featured projects and the latest posts.
    { url: url("/"), lastModified: latest([...projects, ...posts]) },
    { url: url("/projects"), lastModified: latest(projects) },
    ...projects.map((project) => ({
      url: url(`/projects/${project.slug}`),
      lastModified: project.updatedAt,
    })),
    { url: url("/blog"), lastModified: latest(posts) },
    ...posts.map((post) => ({
      url: url(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
    })),
    { url: url("/about"), lastModified: about?.updatedAt },
  ];
}

/** The most recent change in a list, or undefined if it's empty. */
function latest(items: { updatedAt: Date }[]) {
  const times = items.map((item) => item.updatedAt.getTime());
  return times.length > 0 ? new Date(Math.max(...times)) : undefined;
}
