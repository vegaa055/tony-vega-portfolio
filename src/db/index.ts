import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import * as schema from "./schema";

function createPool() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  // Without a listener, an error on an idle connection (e.g. the database
  // restarting) would crash the whole server process.
  pool.on("error", (error) => {
    console.error("[db] idle connection error:", error.message);
  });

  // On Vercel Fluid compute, release idle connections before the instance
  // suspends. Outside Vercel this does nothing.
  attachDatabasePool(pool);

  return pool;
}

// Reuse one pool across hot reloads in development. Otherwise every file
// edit would open a fresh set of connections.
const globalForDb = globalThis as unknown as { pool?: Pool };
const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle({ client: pool, schema, casing: "snake_case" });
