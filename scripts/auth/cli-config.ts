/**
 * Entry point for the Better Auth CLI, which reads the auth config to generate
 * the Drizzle schema for its tables:
 *
 *   npm run auth:schema
 *
 * The app's own instance imports server-only modules the CLI can't load, so
 * this builds an equivalent instance on a mock database (no connection).
 */
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "../../src/db/schema";
import { createAuth } from "../../src/lib/auth/create-auth";

export const auth = createAuth({
  db: drizzle.mock({ schema, casing: "snake_case" }),
  schema,
});
