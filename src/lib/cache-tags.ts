/**
 * Cache tag names shared by the data layer (which tags cached reads) and the
 * admin panel (which revalidates them after a save). Keeping them in one
 * place means a save can't miss the pages that show what changed.
 */
export const CACHE_TAGS = {
  /** Every project list and project page. */
  projects: "projects",
  project: (slug: string) => `project:${slug}`,
  /** Every post list and post page. */
  posts: "posts",
  post: (slug: string) => `post:${slug}`,
  about: "about",
} as const;
