import type { Metadata } from "next";

import { PostEditor } from "@/components/admin/post-editor";
import { ResetOnNavigation } from "@/components/admin/reset-on-navigation";
import { getTagNames } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { getUploadMode } from "@/lib/uploads/server";

export const metadata: Metadata = {
  title: "New post",
};

export const instant = false; // See (panel)/layout.tsx.

export default async function NewPostPage() {
  await requireAdmin();

  return (
    <ResetOnNavigation>
      <PostEditor
        post={null}
        tagSuggestions={await getTagNames()}
        uploadMode={getUploadMode()}
      />
    </ResetOnNavigation>
  );
}
