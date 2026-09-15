import type { Metadata } from "next";

import { AboutEditor } from "@/components/admin/about-editor";
import { getAboutForEditor } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { getUploadMode } from "@/lib/uploads/server";

export const metadata: Metadata = {
  title: "About page",
};

export default async function AboutEditorPage() {
  await requireAdmin();

  return (
    <AboutEditor
      about={await getAboutForEditor()}
      uploadMode={getUploadMode()}
    />
  );
}
