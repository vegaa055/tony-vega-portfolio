import Link from "next/link";

import type { PostSummary } from "@/data/posts";
import { displayFont } from "@/lib/fonts";
import { formatDate, isoDate } from "@/lib/format";

type PostListProps = {
  posts: PostSummary[];
  /** h2 on the blog index, h3 inside a titled section. */
  headingLevel?: "h2" | "h3";
};

export function PostList({
  posts,
  headingLevel: Heading = "h3",
}: PostListProps) {
  return (
    <ol className="reading-backdrop border-t border-line">
      {posts.map((post) => (
        <li key={post.slug} className="border-b border-line">
          <article className="group relative grid gap-3 py-8 outline-offset-4 outline-flare has-[a:focus-visible]:outline-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8">
            <p className="font-mono text-micro tracking-[0.16em] text-faint uppercase sm:pt-2.5">
              <time dateTime={isoDate(post.publishedAt)}>
                {formatDate(post.publishedAt)}
              </time>
            </p>

            <div>
              <Heading
                className={`${displayFont.className} text-xl tracking-[-0.01em] text-balance wrap-anywhere text-star transition-colors duration-300 group-hover:text-flare-soft sm:text-2xl`}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="outline-none after:absolute after:inset-0"
                >
                  {post.title}
                </Link>
              </Heading>
              {post.excerpt ? (
                <p className="mt-2 max-w-reading leading-relaxed text-dust">
                  {post.excerpt}
                </p>
              ) : null}
              <p className="mt-4 font-mono text-micro tracking-[0.16em] text-faint uppercase">
                {post.readingMinutes} min read
                {post.tags.length > 0
                  ? ` · ${post.tags.map((tag) => tag.name).join(", ")}`
                  : null}
              </p>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
