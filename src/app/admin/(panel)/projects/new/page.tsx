import type { Metadata } from "next";

import { ProjectEditor } from "@/components/admin/project-editor";
import { ResetOnNavigation } from "@/components/admin/reset-on-navigation";
import { getTagNames } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { getUploadMode } from "@/lib/uploads/server";

export const metadata: Metadata = {
  title: "New project",
};

export const instant = false; // See (panel)/layout.tsx.

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <ResetOnNavigation>
      <ProjectEditor
        project={null}
        tagSuggestions={await getTagNames()}
        uploadMode={getUploadMode()}
      />
    </ResetOnNavigation>
  );
}
