import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so load .env* files the same way Next does.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

// Migrations need a direct connection: Neon's pooled URL runs through PgBouncer,
// which can't hold the session state migrations rely on. An empty value counts
// as unset.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!url) {
  // Variable names only, never values: shows whether the database variables
  // are missing entirely or were added under other names (a Vercel
  // integration prefix, say).
  const related = Object.keys(process.env)
    .filter((name) => /DATABASE|POSTGRES|NEON|^PG/.test(name))
    .sort()
    .map((name) => (process.env[name] ? name : `${name} (empty)`));
  throw new Error(
    [
      "Neither DATABASE_URL_UNPOOLED nor DATABASE_URL has a value. Copy .env.example to .env.local and try again.",
      related.length > 0
        ? `Database-related variables that are set: ${related.join(", ")}`
        : "No database-related variables are set.",
      process.env.VERCEL_ENV
        ? `Vercel environment: ${process.env.VERCEL_ENV}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
