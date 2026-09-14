import type { Tag } from "@/db/schema";

/** The public face of a tag: what's shown and where it links. */
export type TagRef = Pick<Tag, "name" | "slug">;

/** Flattens a join-table relation into tags sorted by name. */
export function toTagRefs(links: { tag: Tag }[]): TagRef[] {
  return links
    .map(({ tag }) => ({ name: tag.name, slug: tag.slug }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
