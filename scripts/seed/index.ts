/**
 * Loads the starting content: projects, posts, tags, and the About page.
 *
 *   npm run db:seed              add anything missing, keep existing rows
 *   npm run db:seed -- --force   overwrite existing rows with the seed data
 *
 * By default existing rows are never touched, so re-running this after
 * editing content in the admin panel is safe.
 */
import { loadEnvConfig } from "@next/env";
import { eq, inArray } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";
import { slugify } from "@/lib/slug";

import { aboutSeed } from "./about";
import { content } from "./lib";
import { postSeeds, type PostSeed } from "./posts";
import { projectSeeds, type ProjectSeed } from "./projects";

type Database = NodePgDatabase<typeof schema>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type TagIds = Map<string, string>;

const { aboutPage, posts, postTags, projects, projectTags, tags } = schema;

function log(symbol: "+" | "~" | "=", kind: string, name: string) {
  const outcome = { "+": "created", "~": "overwritten", "=": "exists, kept" };
  console.log(`  ${symbol} ${kind.padEnd(8)} ${name} (${outcome[symbol]})`);
}

function tagIdFor(tagIds: TagIds, name: string) {
  const id = tagIds.get(slugify(name));
  if (!id) throw new Error(`Tag "${name}" was not created.`);
  return id;
}

async function seedTags(tx: Transaction, names: string[]) {
  const bySlug = new Map(names.map((name) => [slugify(name), name]));
  if (bySlug.size === 0) return new Map() as TagIds;

  await tx
    .insert(tags)
    .values([...bySlug].map(([slug, name]) => ({ slug, name })))
    .onConflictDoNothing();

  const rows = await tx
    .select({ id: tags.id, slug: tags.slug })
    .from(tags)
    .where(inArray(tags.slug, [...bySlug.keys()]));

  return new Map(rows.map((row) => [row.slug, row.id])) as TagIds;
}

async function seedProject(
  tx: Transaction,
  seed: ProjectSeed,
  tagIds: TagIds,
  force: boolean,
) {
  const { bodyFile, tags: tagNames, ...fields } = seed;
  const values = { ...fields, body: content(bodyFile) };

  const existing = await tx.query.projects.findFirst({
    where: eq(projects.slug, seed.slug),
    columns: { id: true },
  });
  if (existing && !force) return log("=", "project", seed.slug);

  let id: string;
  if (existing) {
    id = existing.id;
    await tx.update(projects).set(values).where(eq(projects.id, id));
    await tx.delete(projectTags).where(eq(projectTags.projectId, id));
  } else {
    const [row] = await tx
      .insert(projects)
      .values(values)
      .returning({ id: projects.id });
    id = row.id;
  }

  if (tagNames.length > 0) {
    await tx.insert(projectTags).values(
      tagNames.map((name) => ({
        projectId: id,
        tagId: tagIdFor(tagIds, name),
      })),
    );
  }
  log(existing ? "~" : "+", "project", seed.slug);
}

async function seedPost(
  tx: Transaction,
  seed: PostSeed,
  tagIds: TagIds,
  force: boolean,
) {
  const { bodyFile, tags: tagNames, ...fields } = seed;
  const values = { ...fields, body: content(bodyFile) };

  const existing = await tx.query.posts.findFirst({
    where: eq(posts.slug, seed.slug),
    columns: { id: true },
  });
  if (existing && !force) return log("=", "post", seed.slug);

  let id: string;
  if (existing) {
    id = existing.id;
    await tx.update(posts).set(values).where(eq(posts.id, id));
    await tx.delete(postTags).where(eq(postTags.postId, id));
  } else {
    const [row] = await tx
      .insert(posts)
      .values(values)
      .returning({ id: posts.id });
    id = row.id;
  }

  if (tagNames.length > 0) {
    await tx
      .insert(postTags)
      .values(
        tagNames.map((name) => ({ postId: id, tagId: tagIdFor(tagIds, name) })),
      );
  }
  log(existing ? "~" : "+", "post", seed.slug);
}

async function seedAbout(tx: Transaction, force: boolean) {
  const insert = tx.insert(aboutPage).values({ id: 1, ...aboutSeed });
  const written = force
    ? await insert
        .onConflictDoUpdate({ target: aboutPage.id, set: aboutSeed })
        .returning({ id: aboutPage.id })
    : await insert.onConflictDoNothing().returning({ id: aboutPage.id });

  if (written.length === 0) return log("=", "about", "about page");
  log(force ? "~" : "+", "about", "about page");
}

async function main() {
  loadEnvConfig(process.cwd(), true);
  const force = process.argv.includes("--force");

  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local.",
    );
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema, casing: "snake_case" });

  console.log(
    force
      ? "Seeding, overwriting existing rows:"
      : "Seeding, keeping existing rows:",
  );

  try {
    // All or nothing: a failure part-way leaves the database unchanged.
    await db.transaction(async (tx) => {
      const tagIds = await seedTags(tx, [
        ...projectSeeds.flatMap((seed) => seed.tags),
        ...postSeeds.flatMap((seed) => seed.tags),
      ]);
      for (const seed of projectSeeds)
        await seedProject(tx, seed, tagIds, force);
      for (const seed of postSeeds) await seedPost(tx, seed, tagIds, force);
      await seedAbout(tx, force);
    });
    console.log("Done.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
