import type { Metadata } from "next";

import { ProjectEditor } from "@/components/admin/project-editor";
import { getTagNames } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { getUploadMode } from "@/lib/uploads/server";

export const metadata: Metadata = {
  title: "New project",
};

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <ProjectEditor
      project={null}
      tagSuggestions={await getTagNames()}
      uploadMode={getUploadMode()}
    />
  );
}
