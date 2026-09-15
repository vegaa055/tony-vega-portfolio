/**
 * Prepares the end-to-end test database: recreates it, applies migrations,
 * loads the seed content, and creates the test accounts. Playwright runs this
 * (with the settings from e2e/env.ts) before building the server under test.
 */
import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";

import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth/create-auth";

import { E2E_ADMIN, E2E_TWO_FACTOR_USER } from "../../e2e/env";

/** The test database's name, after checking it's safe to delete. */
function testDatabaseName() {
  const url = process.env.DATABASE_URL;
  const name = url ? new URL(url).pathname.slice(1) : "";

  // This script deletes the whole database, so be certain it's a test one.
  if (
    !url ||
    process.env.DATABASE_URL_UNPOOLED !== url ||
    !/^[a-z0-9_]+_test$/.test(name)
  ) {
    throw new Error(
      "Refusing to run: DATABASE_URL and DATABASE_URL_UNPOOLED must both " +
        'point at a database whose name ends in "_test". ' +
        "Start the tests with npm run test:e2e.",
    );
  }
  return { url, name };
}

async function recreateDatabase(url: string, name: string) {
  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";
  const client = new Client({ connectionString: maintenance.toString() });
  await client.connect();
  try {
    // The name was checked above, so it's safe to put in the query.
    await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }
}

async function main() {
  const { url, name } = testDatabaseName();
  await recreateDatabase(url, name);

  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema, casing: "snake_case" });

  try {
    await migrate(db, { migrationsFolder: "drizzle" });

    // The same starting content as a local setup.
    const seed = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/seed/index.ts"],
      { stdio: "inherit", env: process.env },
    );
    if (seed.status !== 0) throw new Error("Seeding the test database failed.");

    const auth = createAuth({ db, schema, allowSignUp: true });
    for (const account of [E2E_ADMIN, E2E_TWO_FACTOR_USER]) {
      await auth.api.signUpEmail({ body: account });
    }
  } finally {
    await pool.end();
  }

  await rm(process.env.LOCAL_UPLOAD_DIR || ".e2e/uploads", {
    recursive: true,
    force: true,
  });
  console.log(`Test database "${name}" is ready.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
