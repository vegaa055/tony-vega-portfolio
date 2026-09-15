import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PostList } from "@/components/post-list";
import { sections } from "@/config/site";
import { getPublishedPosts } from "@/data/posts";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  path: "/blog",
  title: "Blog",
  description:
    "Notes from Tony Vega on building things: what worked, what broke, and what it taught.",
});

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <PageHeader {...sections.blog} />
      <div className="mx-auto max-w-site px-4 py-14 sm:px-8 sm:py-20">
        {posts.length === 0 ? (
          <EmptyState title="No posts yet">
            The first entry is on its way.
          </EmptyState>
        ) : (
          <PostList posts={posts} headingLevel="h2" />
        )}
      </div>
    </>
  );
}
