import "server-only";

import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";

import { createAuth } from "./create-auth";

/** The site's auth instance. Sign-up is always disabled here. */
export const auth = createAuth({
  db,
  schema,
  // Lets Server Actions that call auth.api set cookies. Must be the last plugin.
  plugins: [nextCookies()],
});
