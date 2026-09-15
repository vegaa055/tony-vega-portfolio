import type { Metadata } from "next";

import { PostEditor } from "@/components/admin/post-editor";
import { getTagNames } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { getUploadMode } from "@/lib/uploads/server";

export const metadata: Metadata = {
  title: "New post",
};

export default async function NewPostPage() {
  await requireAdmin();

  return (
    <PostEditor
      post={null}
      tagSuggestions={await getTagNames()}
      uploadMode={getUploadMode()}
    />
  );
}
