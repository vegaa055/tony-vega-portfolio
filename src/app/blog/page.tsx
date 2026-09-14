import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes from Tony Vega on building things: what worked, what broke, and what it taught.",
};

export default function BlogPage() {
  return (
    <>
      <PageHeader
        index="02"
        eyebrow="Log"
        title="Blog"
        description="Notes on building things: what worked, what broke, and what it taught."
      />
      <div className="mx-auto max-w-site px-4 py-16 sm:px-8 sm:py-20">
        <EmptyState title="No posts yet">
          The first entry is on its way.
        </EmptyState>
      </div>
    </>
  );
}
