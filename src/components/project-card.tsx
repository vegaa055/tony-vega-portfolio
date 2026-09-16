import Link from "next/link";

import { ChipList } from "@/components/chip-list";
import { ProjectCover } from "@/components/project-cover";
import { Reticle } from "@/components/reticle";
import type { ProjectSummary } from "@/data/projects";
import { displayFont } from "@/lib/fonts";
import { catalogNumber, yearOf } from "@/lib/format";

type ProjectCardProps = {
  project: ProjectSummary;
  /** Position in the catalog, shown as "No. 01". */
  position: number;
  /** h2 on the projects index, h3 inside a titled section. */
  headingLevel?: "h2" | "h3";
  sizes?: string;
};

export function ProjectCard({
  project,
  position,
  headingLevel: Heading = "h3",
  sizes = "(min-width: 1216px) 568px, (min-width: 640px) 50vw, 100vw",
}: ProjectCardProps) {
  const year = yearOf(project.publishedAt);

  return (
    // The title link stretches over the whole card, so the card is one link.
    <article className="group relative flex flex-col outline-offset-8 outline-flare has-[a:focus-visible]:outline-2">
      {/* The standard social-share shape (1200×630), so share images used as
          covers aren't cropped. Taller images keep their top edge. */}
      <div className="relative aspect-[1200/630] overflow-hidden border border-line bg-deep">
        <ProjectCover
          image={project.coverImage}
          slug={project.slug}
          title={project.title}
          sizes={sizes}
          className="object-top transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
        />
        <div className="absolute inset-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <Reticle tone="accent" />
        </div>
      </div>

      <p
        aria-hidden="true"
        className="mt-5 flex items-center justify-between font-mono text-micro tracking-[0.18em] text-faint uppercase"
      >
        <span>
          <span className="text-flare">No.</span> {catalogNumber(position)}
        </span>
        {year ? <span>{year}</span> : null}
      </p>

      <Heading
        className={`${displayFont.className} mt-2 text-xl tracking-[-0.01em] text-star sm:text-2xl`}
      >
        <Link
          href={`/projects/${project.slug}`}
          className="outline-none after:absolute after:inset-0"
        >
          {project.title}
        </Link>
      </Heading>

      {project.tagline ? (
        <p className="mt-2 leading-relaxed text-dust">{project.tagline}</p>
      ) : null}

      <ChipList items={project.techStack} label="Built with" className="mt-4" />
    </article>
  );
}
