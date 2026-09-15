import "server-only";

import { and, asc, desc, eq, inArray, max, notExists, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  aboutPage,
  posts,
  postTags,
  projects,
  projectTags,
  tags,
  type ContentImage,
  type ExperienceEntry,
  type SkillGroup,
} from "@/db/schema";
import { slugify } from "@/lib/slug";
import type { AboutValues, PostValues, ProjectValues } from "@/lib/validation";

// Admin reads are never cached: the editor must always see the latest data.
// Every caller is an admin page or Server Action that has already called
// requireAdmin().

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Thrown when a slug is already used by another post or project. */
export class SlugTakenError extends Error {
  constructor() {
    super("That URL is already in use.");
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  // Drizzle wraps driver errors; the Postgres error is the cause.
  return "cause" in error && isUniqueViolation(error.cause);
}

/** "2026-09-14" for a date input, or "" when there's no date. */
function dateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

const isUuid = (value: string) => z.uuid().safeParse(value).success;

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

/** Everything the content dashboard lists, drafts included. */
export async function getDashboardData() {
  const [projectRows, postRows] = await Promise.all([
    db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        status: projects.status,
        featured: projects.featured,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .orderBy(asc(projects.sortOrder), asc(projects.title)),
    db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        status: posts.status,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .orderBy(desc(sql`coalesce(${posts.publishedAt}, ${posts.updatedAt})`)),
  ]);

  return { projects: projectRows, posts: postRows };
}

/**
 * Moves a project one place up or down in the display order. Renumbers every
 * project in steps of 10, so duplicate or gapped sort orders can't get stuck.
 * Returns false when the project is already at that end of the list.
 */
export async function moveProject(id: string, direction: "up" | "down") {
  return db.transaction(async (tx) => {
    const ordered = await tx
      .select({ id: projects.id, sortOrder: projects.sortOrder })
      .from(projects)
      .orderBy(asc(projects.sortOrder), asc(projects.title));

    const from = ordered.findIndex((project) => project.id === id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from === -1 || to < 0 || to >= ordered.length) return false;

    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];

    for (const [position, project] of ordered.entries()) {
      const sortOrder = (position + 1) * 10;
      if (project.sortOrder === sortOrder) continue;
      await tx
        .update(projects)
        // Reordering isn't an edit, so keep the last-updated time as it was.
        .set({ sortOrder, updatedAt: sql`${projects.updatedAt}` })
        .where(eq(projects.id, project.id));
    }
    return true;
  });
}

/* -------------------------------------------------------------------------- */
/* Tags                                                                       */
/* -------------------------------------------------------------------------- */

/** All tag names, for editor suggestions. */
export async function getTagNames() {
  const rows = await db
    .select({ name: tags.name })
    .from(tags)
    .orderBy(asc(tags.name));
  return rows.map((row) => row.name);
}

/** Finds or creates tags by name and returns their ids. */
async function tagIdsFor(tx: Transaction, names: string[]) {
  const bySlug = new Map<string, string>();
  for (const raw of names) {
    const name = raw.trim().replace(/\s+/g, " ");
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  if (bySlug.size === 0) return [];

  await tx
    .insert(tags)
    .values([...bySlug].map(([slug, name]) => ({ slug, name })))
    .onConflictDoNothing();

  const rows = await tx
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.slug, [...bySlug.keys()]));
  return rows.map((row) => row.id);
}

/** Removes tags no post or project uses, so suggestions stay tidy. */
async function deleteUnusedTags(tx: Transaction) {
  await tx
    .delete(tags)
    .where(
      and(
        notExists(
          tx.select().from(postTags).where(eq(postTags.tagId, tags.id)),
        ),
        notExists(
          tx.select().from(projectTags).where(eq(projectTags.tagId, tags.id)),
        ),
      ),
    );
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export type EditableProject = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  body: string;
  coverImage: ContentImage | null;
  gallery: ContentImage[];
  techStack: string[];
  tags: string[];
  repoUrl: string;
  liveUrl: string;
  featured: boolean;
  status: "draft" | "published";
  publishedAt: string;
};

export async function getProjectForEditor(
  id: string,
): Promise<EditableProject | null> {
  if (!isUuid(id)) return null;

  const row = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: { projectTags: { with: { tag: true } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    summary: row.summary,
    body: row.body,
    coverImage: row.coverImage,
    gallery: row.gallery,
    techStack: row.techStack,
    tags: row.projectTags.map(({ tag }) => tag.name).sort(),
    repoUrl: row.repoUrl ?? "",
    liveUrl: row.liveUrl ?? "",
    featured: row.featured,
    status: row.status,
    publishedAt: dateInputValue(row.publishedAt),
  };
}

/**
 * Creates (id null) or updates a project with its tags. Returns the saved
 * slug, plus the previous slug when it changed, so both pages get refreshed.
 */
export async function saveProject(id: string | null, values: ProjectValues) {
  const { tags: tagNames, ...fields } = values;
  const publishedAt =
    fields.status === "published"
      ? (fields.publishedAt ?? new Date())
      : fields.publishedAt;

  try {
    return await db.transaction(async (tx) => {
      let projectId: string;
      let previousSlug: string | null = null;

      if (id) {
        const [existing] = await tx
          .select({ slug: projects.slug })
          .from(projects)
          .where(eq(projects.id, id));
        if (!existing) throw new Error("This project no longer exists.");
        previousSlug = existing.slug;

        await tx
          .update(projects)
          .set({ ...fields, publishedAt })
          .where(eq(projects.id, id));
        projectId = id;
      } else {
        // New projects go to the end of the display order.
        const [{ last }] = await tx
          .select({ last: max(projects.sortOrder) })
          .from(projects);
        const [created] = await tx
          .insert(projects)
          .values({ ...fields, publishedAt, sortOrder: (last ?? 0) + 10 })
          .returning({ id: projects.id });
        projectId = created.id;
      }

      await tx.delete(projectTags).where(eq(projectTags.projectId, projectId));
      const tagIds = await tagIdsFor(tx, tagNames);
      if (tagIds.length > 0) {
        await tx
          .insert(projectTags)
          .values(tagIds.map((tagId) => ({ projectId, tagId })));
      }
      await deleteUnusedTags(tx);

      return {
        id: projectId,
        slug: fields.slug,
        previousSlug,
        publishedAt: dateInputValue(publishedAt),
      };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new SlugTakenError();
    throw error;
  }
}

/** Deletes a project. Returns its slug, or null if it was already gone. */
export async function deleteProject(id: string) {
  if (!isUuid(id)) return null;
  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ slug: projects.slug });
    await deleteUnusedTags(tx);
    return deleted?.slug ?? null;
  });
}

/* -------------------------------------------------------------------------- */
/* Posts                                                                      */
/* -------------------------------------------------------------------------- */

export type EditablePost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: ContentImage | null;
  tags: string[];
  status: "draft" | "published";
  publishedAt: string;
};

export async function getPostForEditor(
  id: string,
): Promise<EditablePost | null> {
  if (!isUuid(id)) return null;

  const row = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: { postTags: { with: { tag: true } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverImage: row.coverImage,
    tags: row.postTags.map(({ tag }) => tag.name).sort(),
    status: row.status,
    publishedAt: dateInputValue(row.publishedAt),
  };
}

/** Creates (id null) or updates a post with its tags. */
export async function savePost(id: string | null, values: PostValues) {
  const { tags: tagNames, ...fields } = values;
  const publishedAt =
    fields.status === "published"
      ? (fields.publishedAt ?? new Date())
      : fields.publishedAt;

  try {
    return await db.transaction(async (tx) => {
      let postId: string;
      let previousSlug: string | null = null;

      if (id) {
        const [existing] = await tx
          .select({ slug: posts.slug })
          .from(posts)
          .where(eq(posts.id, id));
        if (!existing) throw new Error("This post no longer exists.");
        previousSlug = existing.slug;

        await tx
          .update(posts)
          .set({ ...fields, publishedAt })
          .where(eq(posts.id, id));
        postId = id;
      } else {
        const [created] = await tx
          .insert(posts)
          .values({ ...fields, publishedAt })
          .returning({ id: posts.id });
        postId = created.id;
      }

      await tx.delete(postTags).where(eq(postTags.postId, postId));
      const tagIds = await tagIdsFor(tx, tagNames);
      if (tagIds.length > 0) {
        await tx
          .insert(postTags)
          .values(tagIds.map((tagId) => ({ postId, tagId })));
      }
      await deleteUnusedTags(tx);

      return {
        id: postId,
        slug: fields.slug,
        previousSlug,
        publishedAt: dateInputValue(publishedAt),
      };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new SlugTakenError();
    throw error;
  }
}

/** Deletes a post. Returns its slug, or null if it was already gone. */
export async function deletePost(id: string) {
  if (!isUuid(id)) return null;
  return db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(posts)
      .where(eq(posts.id, id))
      .returning({ slug: posts.slug });
    await deleteUnusedTags(tx);
    return deleted?.slug ?? null;
  });
}

/* -------------------------------------------------------------------------- */
/* About page                                                                 */
/* -------------------------------------------------------------------------- */

export type EditableAbout = {
  headline: string;
  bio: string;
  portrait: ContentImage | null;
  skills: SkillGroup[];
  experience: ExperienceEntry[];
};

export async function getAboutForEditor(): Promise<EditableAbout> {
  const row = await db.query.aboutPage.findFirst();
  return {
    headline: row?.headline ?? "",
    bio: row?.bio ?? "",
    portrait: row?.portrait ?? null,
    skills: row?.skills ?? [],
    experience: row?.experience ?? [],
  };
}

/** Creates or replaces the single About page row. */
export async function saveAbout(values: AboutValues) {
  await db
    .insert(aboutPage)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: aboutPage.id, set: values });
}
