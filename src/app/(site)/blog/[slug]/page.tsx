import type { Metadata, Route } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/back-link";
import { JsonLd } from "@/components/json-ld";
import { Pager } from "@/components/pager";
import { getPublishedPost, getPublishedPosts } from "@/data/posts";
import { formatDate, isoDate } from "@/lib/format";
import { blogPostingJsonLd } from "@/lib/json-ld";
import { renderMarkdown } from "@/lib/markdown/render";
import { pageMetadata } from "@/lib/metadata";
import { slugParams } from "@/lib/static-params";

// This page looks up the post before rendering anything, so a missing or
// draft post shows the not-found page and nothing of the draft. Published
// posts are prerendered; for any other slug the response has already started
// streaming, so the status stays 200 and Next.js adds a noindex tag (a "soft
// 404"). Navigating here waits for the page rather than showing a loading
// shell, so opt out of Next.js's instant-navigation check.
export const instant = false;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return slugParams(posts.map((post) => post.slug));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Post not found" };

  return pageMetadata({
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt,
    article: { publishedTime: post.publishedAt },
  });
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const [{ content }, allPosts] = await Promise.all([
    renderMarkdown(post.body),
    getPublishedPosts(),
  ]);

  // The list is newest first.
  const position = allPosts.findIndex((p) => p.slug === post.slug);
  const newer = position > 0 ? allPosts[position - 1] : null;
  const older =
    position >= 0 && position < allPosts.length - 1
      ? allPosts[position + 1]
      : null;
  const cover = post.coverImage;

  return (
    <article>
      <JsonLd data={blogPostingJsonLd(post)} />
      <header className="mx-auto max-w-site px-4 pt-10 sm:px-8 sm:pt-14">
        <BackLink href="/blog">All posts</BackLink>

        <div className="mx-auto max-w-reading pt-12 pb-12 sm:pt-16">
          <p className="animate-rise font-mono text-label tracking-[0.18em] text-faint uppercase">
            <time dateTime={isoDate(post.publishedAt)} className="text-flare">
              {formatDate(post.publishedAt)}
            </time>{" "}
            · {post.readingMinutes} min read
          </p>
          <h1 className="mt-5 animate-rise text-[clamp(2.1rem,5vw,3.25rem)] leading-[1.1] font-medium tracking-tight text-balance text-star [animation-delay:80ms]">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-5 animate-rise text-lg leading-relaxed text-dust [animation-delay:160ms] sm:text-xl">
              {post.excerpt}
            </p>
          ) : null}
          {post.tags.length > 0 ? (
            <ul
              aria-label="Tags"
              className="mt-6 flex animate-rise flex-wrap gap-x-4 gap-y-2 font-mono text-micro tracking-[0.16em] text-dust uppercase [animation-delay:200ms]"
            >
              {post.tags.map((tag) => (
                <li key={tag.slug}>
                  <span aria-hidden="true" className="text-flare">
                    #
                  </span>
                  {tag.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      {cover ? (
        <div className="mx-auto max-w-4xl px-4 pb-12 sm:px-8">
          <div
            className="relative overflow-hidden border border-line bg-deep"
            style={{
              aspectRatio:
                cover.width && cover.height
                  ? `${cover.width} / ${cover.height}`
                  : "16 / 9",
            }}
          >
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              preload
              sizes="(min-width: 896px) 832px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-site px-4 pb-20 sm:px-8 sm:pb-24">
        <div className="prose-field mx-auto max-w-reading border-t border-line pt-10">
          {content}
        </div>
      </div>

      <Pager
        label="More posts"
        previous={
          newer
            ? {
                href: `/blog/${newer.slug}` as Route,
                title: newer.title,
                caption: "Newer post",
              }
            : null
        }
        next={
          older
            ? {
                href: `/blog/${older.slug}` as Route,
                title: older.title,
                caption: "Older post",
              }
            : null
        }
      />
    </article>
  );
}
