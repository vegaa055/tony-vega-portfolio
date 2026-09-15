import { sections, siteConfig } from "@/config/site";
import { getPublishedPosts } from "@/data/posts";
import { renderRss } from "@/lib/feed";
import { feed } from "@/lib/metadata";

/** The blog's RSS feed, rebuilt whenever a post is saved. */
export async function GET() {
  const posts = await getPublishedPosts();
  const url = (path: string) => new URL(path, siteConfig.url).href;

  const xml = renderRss({
    title: feed.title,
    description: sections.blog.description,
    siteUrl: url("/blog"),
    feedUrl: url(feed.path),
    items: posts.map((post) => ({
      title: post.title,
      url: url(`/blog/${post.slug}`),
      description: post.excerpt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      categories: post.tags.map((tag) => tag.name),
    })),
  });

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
