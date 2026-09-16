import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { siteConfig } from "@/config/site";
import type * as schema from "@/db/schema";

type CreateAuthOptions = {
  db: NodePgDatabase<typeof schema>;
  /** The drizzle schema module, so the adapter can find the auth tables. */
  schema: typeof schema;
  /**
   * Only the account script allows sign-up. The site itself never does:
   * Better Auth enforces this inside the sign-up endpoint, so it also blocks
   * server-side calls.
   */
  allowSignUp?: boolean;
  /** Plugins appended after the defaults (nextCookies must come last). */
  plugins?: BetterAuthPlugin[];
};

function trustedOrigins() {
  // siteConfig.url is the live site, or a preview deployment's own address.
  const origins = [siteConfig.url];
  // Preview deployments also answer on their per-deployment URL.
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (host) origins.push(`https://${host}`);
  }
  return origins;
}

/**
 * The one place auth is configured. The site and the account script build
 * their instances here so they can never drift apart.
 */
export function createAuth({
  db,
  schema,
  allowSignUp = false,
  plugins = [],
}: CreateAuthOptions) {
  return betterAuth({
    appName: "Tony Vega",
    baseURL: siteConfig.url,
    trustedOrigins: trustedOrigins(),
    database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowSignUp,
      minPasswordLength: 12,
      autoSignIn: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // a week
      updateAge: 60 * 60 * 24, // refreshed at most daily
    },
    rateLimit: {
      // On in development too, so the limits can be tested locally.
      enabled: true,
      // In-memory counts reset per serverless instance; the database doesn't.
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/two-factor/*": { window: 60, max: 10 },
      },
    },
    plugins: [twoFactor({ issuer: "Tony Vega" }), ...plugins],
  });
}

export type Auth = ReturnType<typeof createAuth>;
