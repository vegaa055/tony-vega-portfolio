import type { Metadata } from "next";

import { AboutEditor } from "@/components/admin/about-editor";
import { ResetOnNavigation } from "@/components/admin/reset-on-navigation";
import { getAboutForEditor } from "@/data/admin";
import { requireAdmin } from "@/lib/auth/session";
import { getUploadMode } from "@/lib/uploads/server";

export const metadata: Metadata = {
  title: "About page",
};

export const instant = false; // See (panel)/layout.tsx.

export default async function AboutEditorPage() {
  await requireAdmin();

  return (
    <ResetOnNavigation>
      <AboutEditor
        about={await getAboutForEditor()}
        uploadMode={getUploadMode()}
      />
    </ResetOnNavigation>
  );
}
