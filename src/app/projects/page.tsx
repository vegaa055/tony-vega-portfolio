import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Simulations, audio software, and web apps by Tony Vega, with notes on how each one works.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        index="01"
        eyebrow="Catalog"
        title="Projects"
        description="Simulations, audio software, and web apps, with notes on how each one works."
      />
      <div className="mx-auto max-w-site px-4 py-16 sm:px-8 sm:py-20">
        <EmptyState title="No projects published yet">
          Check back soon.
        </EmptyState>
      </div>
    </>
  );
}
