/**
 * Slug prerendered when there's no published content yet.
 *
 * With Cache Components, generateStaticParams must return at least one param
 * or the build fails. This slug never matches a real row (real slugs use only
 * lowercase letters, digits, and hyphens), so it renders the 404 page.
 */
const PLACEHOLDER_SLUG = "_none";

export function slugParams(slugs: string[]) {
  const list = slugs.length > 0 ? slugs : [PLACEHOLDER_SLUG];
  return list.map((slug) => ({ slug }));
}
