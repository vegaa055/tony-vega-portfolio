import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectEditor } from "@/components/admin/project-editor";
import { getProjectForEditor, getTagNames } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { getUploadMode } from "@/lib/uploads/server";

export const metadata: Metadata = {
  title: "Edit project",
};

export default async function EditProjectPage({
  params,
}: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const [project, tagSuggestions] = await Promise.all([
    getProjectForEditor(id),
    getTagNames(),
  ]);
  if (!project) notFound();

  return (
    <ProjectEditor
      key={project.id}
      project={project}
      tagSuggestions={tagSuggestions}
      uploadMode={getUploadMode()}
    />
  );
}
