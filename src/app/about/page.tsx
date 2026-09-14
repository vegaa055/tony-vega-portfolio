import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "About",
  description: "About Tony Vega: background, skills, and experience.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        index="03"
        eyebrow="Observer"
        title="About"
        description="Background, skills, and experience."
      />
      <div className="mx-auto max-w-site px-4 py-16 sm:px-8 sm:py-20">
        <EmptyState title="Coming soon">This page is being written.</EmptyState>
      </div>
    </>
  );
}
