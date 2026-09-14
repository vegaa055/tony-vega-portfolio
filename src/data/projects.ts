import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { projects, type ContentImage } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";

import { toTagRefs, type TagRef } from "./tags";

export type ProjectSummary = {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  coverImage: ContentImage | null;
  techStack: string[];
  featured: boolean;
  publishedAt: Date | null;
  tags: TagRef[];
};

export type ProjectDetail = ProjectSummary & {
  body: string;
  gallery: ContentImage[];
  repoUrl: string | null;
  liveUrl: string | null;
};

// Reads are cached until an admin save revalidates their tags (Phase 3), with
// the `max` profile as a long safety net.

/** Published projects in display order. */
export async function getPublishedProjects(): Promise<ProjectSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.projects);

  const rows = await db.query.projects.findMany({
    where: eq(projects.status, "published"),
    orderBy: [asc(projects.sortOrder), desc(projects.publishedAt)],
    columns: {
      slug: true,
      title: true,
      tagline: true,
      summary: true,
      coverImage: true,
      techStack: true,
      featured: true,
      publishedAt: true,
    },
    with: { projectTags: { with: { tag: true } } },
  });

  return rows.map(({ projectTags, ...project }) => ({
    ...project,
    tags: toTagRefs(projectTags),
  }));
}

/** Published projects flagged for the home page, in display order. */
export async function getFeaturedProjects() {
  const all = await getPublishedProjects();
  return all.filter((project) => project.featured);
}

/** One published project, or null if it doesn't exist or is a draft. */
export async function getPublishedProject(
  slug: string,
): Promise<ProjectDetail | null> {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.projects, CACHE_TAGS.project(slug));

  const row = await db.query.projects.findFirst({
    where: and(eq(projects.slug, slug), eq(projects.status, "published")),
    with: { projectTags: { with: { tag: true } } },
  });
  if (!row) return null;

  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    summary: row.summary,
    body: row.body,
    coverImage: row.coverImage,
    gallery: row.gallery,
    techStack: row.techStack,
    repoUrl: row.repoUrl,
    liveUrl: row.liveUrl,
    featured: row.featured,
    publishedAt: row.publishedAt,
    tags: toTagRefs(row.projectTags),
  };
}
