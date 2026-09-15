import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Column keys are camelCase in TypeScript and snake_case in Postgres
// (`casing: "snake_case"` in drizzle.config.ts and src/db/index.ts).

// Admin login tables, managed by Better Auth.
export * from "./auth-schema";

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

/** Drafts are only visible in the admin panel. */
export const contentStatus = pgEnum("content_status", ["draft", "published"]);

/** An uploaded image plus the text that describes it. */
export type ContentImage = {
  url: string;
  alt: string;
  caption?: string;
  /** Intrinsic size in pixels, so pages can reserve space before it loads. */
  width?: number;
  height?: number;
};

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export const projects = pgTable(
  "projects",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    /** One line shown under the title on cards. */
    tagline: text().notNull().default(""),
    /** A short paragraph for the project index and social previews. */
    summary: text().notNull().default(""),
    /** Long-form write-up in Markdown. */
    body: text().notNull().default(""),
    coverImage: jsonb().$type<ContentImage>(),
    gallery: jsonb().$type<ContentImage[]>().notNull().default([]),
    /** Tools used, in display order (e.g. "C++", "JUCE 8"). */
    techStack: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    repoUrl: text(),
    liveUrl: text(),
    /** Featured projects appear on the home page. */
    featured: boolean().notNull().default(false),
    /** Manual display order; lower numbers come first. */
    sortOrder: integer().notNull().default(0),
    status: contentStatus().notNull().default("draft"),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("projects_listing_idx").on(
      table.status,
      table.featured,
      table.sortOrder,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Blog posts                                                                 */
/* -------------------------------------------------------------------------- */

export const posts = pgTable(
  "posts",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    /** A short summary for the blog index and social previews. */
    excerpt: text().notNull().default(""),
    /** The post itself, in Markdown. */
    body: text().notNull().default(""),
    coverImage: jsonb().$type<ContentImage>(),
    status: contentStatus().notNull().default("draft"),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("posts_listing_idx").on(table.status, table.publishedAt)],
);

/* -------------------------------------------------------------------------- */
/* Tags (shared by posts and projects)                                        */
/* -------------------------------------------------------------------------- */

export const tags = pgTable("tags", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  slug: text().notNull().unique(),
});

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid()
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("post_tags_tag_idx").on(table.tagId),
  ],
);

export const projectTags = pgTable(
  "project_tags",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: uuid()
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.tagId] }),
    index("project_tags_tag_idx").on(table.tagId),
  ],
);

/* -------------------------------------------------------------------------- */
/* About page (a single row)                                                  */
/* -------------------------------------------------------------------------- */

export type SkillGroup = {
  label: string;
  items: string[];
};

export type ExperienceEntry = {
  kind: "work" | "education";
  role: string;
  organization: string;
  /** Free text, e.g. "Jul 2024 – Jul 2025". */
  period: string;
  description: string;
};

export const aboutPage = pgTable(
  "about_page",
  {
    id: integer().primaryKey().default(1),
    headline: text().notNull().default(""),
    /** Biography in Markdown. */
    bio: text().notNull().default(""),
    portrait: jsonb().$type<ContentImage>(),
    skills: jsonb().$type<SkillGroup[]>().notNull().default([]),
    experience: jsonb().$type<ExperienceEntry[]>().notNull().default([]),
    updatedAt: timestamps.updatedAt,
  },
  // There is only ever one About page.
  (table) => [check("about_page_single_row", sql`${table.id} = 1`)],
);

/* -------------------------------------------------------------------------- */
/* Relations (used by db.query.* relational queries)                          */
/* -------------------------------------------------------------------------- */

export const projectsRelations = relations(projects, ({ many }) => ({
  projectTags: many(projectTags),
}));

export const postsRelations = relations(posts, ({ many }) => ({
  postTags: many(postTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
  projectTags: many(projectTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, {
    fields: [projectTags.projectId],
    references: [projects.id],
  }),
  tag: one(tags, { fields: [projectTags.tagId], references: [tags.id] }),
}));

/* -------------------------------------------------------------------------- */
/* Row types                                                                  */
/* -------------------------------------------------------------------------- */

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type AboutPage = typeof aboutPage.$inferSelect;
