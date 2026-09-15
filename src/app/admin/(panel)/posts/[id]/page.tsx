import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostEditor } from "@/components/admin/post-editor";
import { getPostForEditor, getTagNames } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { getUploadMode } from "@/lib/uploads/server";

export const metadata: Metadata = {
  title: "Edit post",
};

export default async function EditPostPage({
  params,
}: PageProps<"/admin/posts/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [post, tagSuggestions] = await Promise.all([
    getPostForEditor(id),
    getTagNames(),
  ]);
  if (!post) notFound();

  return (
    <PostEditor
      key={post.id}
      post={post}
      tagSuggestions={tagSuggestions}
      uploadMode={getUploadMode()}
    />
  );
}
