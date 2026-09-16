import { getPublishedProject, getPublishedProjects } from "@/data/projects";
import { yearOf } from "@/lib/format";
import { OG_SIZE, renderCard } from "@/lib/og/card";
import { slugParams } from "@/lib/static-params";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Project title card from Tony Vega's portfolio";

// Build a card for each published project along with its page.
export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return slugParams(projects.map((project) => project.slug));
}

/** The share image for a project: its title, tagline, and cover. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  // Drafts and unknown slugs get a plain card, never the draft's details.
  if (!project) return renderCard({ kicker: "Portfolio", title: "Projects" });

  const year = yearOf(project.publishedAt);
  return renderCard({
    kicker: year ? `Project · ${year}` : "Project",
    title: project.title,
    titleFont: "display",
    description: project.tagline || project.summary,
    imageUrl: project.coverImage?.url,
  });
}
