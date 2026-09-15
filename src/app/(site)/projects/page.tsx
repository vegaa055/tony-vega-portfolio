import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import {
  ProjectsExplorer,
  type ExplorerTag,
} from "@/components/projects-explorer";
import { getPublishedProjects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Simulations, audio software, and web apps by Tony Vega, with notes on how each one works.",
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  const tagCounts = new Map<string, ExplorerTag>();
  for (const project of projects) {
    for (const tag of project.tags) {
      const entry = tagCounts.get(tag.slug) ?? { ...tag, count: 0 };
      entry.count += 1;
      tagCounts.set(tag.slug, entry);
    }
  }
  const tags = [...tagCounts.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader
        index="01"
        eyebrow="Catalog"
        title="Projects"
        description="Simulations, audio software, and web apps, with notes on how each one works."
      />
      <div className="mx-auto max-w-site px-4 py-14 sm:px-8 sm:py-20">
        {projects.length === 0 ? (
          <EmptyState title="No projects published yet">
            Check back soon.
          </EmptyState>
        ) : (
          <ProjectsExplorer
            tags={tags}
            items={projects.map((project, index) => ({
              slug: project.slug,
              tagSlugs: project.tags.map((tag) => tag.slug),
              card: (
                <ProjectCard
                  project={project}
                  position={index + 1}
                  headingLevel="h2"
                />
              ),
            }))}
          />
        )}
      </div>
    </>
  );
}
