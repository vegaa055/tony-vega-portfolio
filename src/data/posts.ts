import "server-only";

import { and, desc, eq, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { posts, type ContentImage } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { readingMinutes } from "@/lib/format";

import { toTagRefs, type TagRef } from "./tags";

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date;
  readingMinutes: number;
  tags: TagRef[];
};

export type PostDetail = PostSummary & {
  body: string;
  coverImage: ContentImage | null;
};

const isPublished = and(
  eq(posts.status, "published"),
  isNotNull(posts.publishedAt),
);

/** Published posts, newest first. */
export async function getPublishedPosts(): Promise<PostSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.posts);

  const rows = await db.query.posts.findMany({
    where: isPublished,
    orderBy: [desc(posts.publishedAt)],
    columns: {
      slug: true,
      title: true,
      excerpt: true,
      body: true,
      publishedAt: true,
    },
    with: { postTags: { with: { tag: true } } },
  });

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    // Guaranteed by the isNotNull filter above.
    publishedAt: row.publishedAt as Date,
    readingMinutes: readingMinutes(row.body),
    tags: toTagRefs(row.postTags),
  }));
}

/** The newest published posts. */
export async function getLatestPosts(limit: number) {
  const all = await getPublishedPosts();
  return all.slice(0, limit);
}

/** One published post, or null if it doesn't exist or is a draft. */
export async function getPublishedPost(
  slug: string,
): Promise<PostDetail | null> {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.post(slug));

  const row = await db.query.posts.findFirst({
    where: and(eq(posts.slug, slug), isPublished),
    with: { postTags: { with: { tag: true } } },
  });
  if (!row) return null;

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverImage: row.coverImage,
    publishedAt: row.publishedAt as Date,
    readingMinutes: readingMinutes(row.body),
    tags: toTagRefs(row.postTags),
  };
}
