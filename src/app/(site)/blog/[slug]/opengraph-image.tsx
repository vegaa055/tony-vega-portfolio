import { getPublishedPost, getPublishedPosts } from "@/data/posts";
import { formatDate } from "@/lib/format";
import { OG_SIZE, renderCard } from "@/lib/og/card";
import { slugParams } from "@/lib/static-params";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Blog post title card from Tony Vega's blog";

// Build a card for each published post along with its page.
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return slugParams(posts.map((post) => post.slug));
}

/** The share image for a post: its date, title, and excerpt. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  // Drafts and unknown slugs get a plain card, never the draft's details.
  if (!post) return renderCard({ kicker: "Log", title: "Blog" });

  return renderCard({
    kicker: `${formatDate(post.publishedAt)} · ${post.readingMinutes} min read`,
    title: post.title,
    titleFont: "display",
    description: post.excerpt,
    imageUrl: post.coverImage?.url,
  });
}
