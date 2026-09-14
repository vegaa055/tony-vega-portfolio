import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import type { AboutPage } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** The About page content, or null before it has been written. */
export async function getAboutPage(): Promise<AboutPage | null> {
  "use cache";
  cacheLife("max");
  cacheTag(CACHE_TAGS.about);

  const row = await db.query.aboutPage.findFirst();
  return row ?? null;
}
