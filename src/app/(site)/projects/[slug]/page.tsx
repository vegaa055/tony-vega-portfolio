import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/back-link";
import { ExternalButton } from "@/components/button-link";
import { ChipList } from "@/components/chip-list";
import { JsonLd } from "@/components/json-ld";
import { Pager } from "@/components/pager";
import { Reticle } from "@/components/reticle";
import { SectionHeading } from "@/components/section-heading";
import { TableOfContents } from "@/components/table-of-contents";
import {
  getPublishedProject,
  getPublishedProjects,
  type ProjectDetail,
} from "@/data/projects";
import { displayFont } from "@/lib/fonts";
import { catalogNumber, yearOf } from "@/lib/format";
import { projectJsonLd } from "@/lib/json-ld";
import { renderMarkdown } from "@/lib/markdown/render";
import { pageMetadata } from "@/lib/metadata";
import { slugParams } from "@/lib/static-params";

// This page looks up the project before rendering anything, so a missing or
// draft project shows the not-found page and nothing of the draft. Published
// projects are prerendered; for any other slug the response has already
// started streaming, so the status stays 200 and Next.js adds a noindex tag
// (a "soft 404"). Navigating here waits for the page rather than showing a
// loading shell, so opt out of Next.js's instant-navigation check.
export const instant = false;

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return slugParams(projects.map((project) => project.slug));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: "Project not found" };

  return pageMetadata({
    path: `/projects/${project.slug}`,
    title: project.title,
    description: project.summary || project.tagline,
    article: { publishedTime: project.publishedAt },
  });
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) notFound();

  const [{ content, headings }, allProjects] = await Promise.all([
    renderMarkdown(project.body),
    getPublishedProjects(),
  ]);

  const position = allProjects.findIndex((p) => p.slug === project.slug);
  const previous = position > 0 ? allProjects[position - 1] : null;
  const next =
    position >= 0 && position < allProjects.length - 1
      ? allProjects[position + 1]
      : null;
  const year = yearOf(project.publishedAt);
  const cover = project.coverImage;

  return (
    <article>
      <JsonLd data={projectJsonLd(project)} />
      <header className="border-b border-line">
        <div className="mx-auto max-w-site px-4 pt-10 pb-12 sm:px-8 sm:pt-14 sm:pb-16">
          <BackLink href="/projects">All projects</BackLink>

          <p className="mt-12 animate-rise font-mono text-label tracking-[0.2em] text-faint uppercase">
            <span aria-hidden="true">
              <span className="text-flare">
                No. {catalogNumber(position + 1)}
              </span>{" "}
              /{" "}
            </span>
            {year ?? "Project"}
          </p>

          <h1
            className={`${displayFont.className} mt-5 max-w-4xl animate-rise text-[clamp(1.8rem,4.8vw,3.4rem)] leading-[1.1] tracking-[-0.01em] text-balance wrap-anywhere [animation-delay:80ms]`}
          >
            {project.title}
          </h1>

          {project.tagline ? (
            <p className="mt-6 max-w-reading animate-rise text-lg leading-relaxed text-dust [animation-delay:160ms] sm:text-xl">
              {project.tagline}
            </p>
          ) : null}

          {project.liveUrl || project.repoUrl ? (
            <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
              {project.liveUrl ? (
                <ExternalButton href={project.liveUrl}>
                  Open live site
                </ExternalButton>
              ) : null}
              {project.repoUrl ? (
                <ExternalButton
                  href={project.repoUrl}
                  variant={project.liveUrl ? "ghost" : "primary"}
                >
                  View source
                </ExternalButton>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {cover ? (
        <div className="mx-auto max-w-site px-4 pt-10 sm:px-8 sm:pt-14">
          <div className="relative animate-rise p-2 [animation-delay:200ms] sm:p-3">
            <Reticle tone="accent" />
            <div
              className="relative overflow-hidden border border-line bg-deep"
              style={{
                aspectRatio:
                  cover.width && cover.height
                    ? `${cover.width} / ${cover.height}`
                    : "16 / 9",
              }}
            >
              <Image
                src={cover.url}
                alt={cover.alt}
                fill
                preload
                sizes="(min-width: 1216px) 1120px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-site gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-20">
        {/* Facts first in reading order; beside the write-up on wide screens. */}
        <aside className="lg:col-start-2 lg:row-start-1">
          <div className="space-y-12 lg:sticky lg:top-28">
            <ProjectSpecs project={project} year={year} />
            <TableOfContents headings={headings} className="hidden lg:block" />
          </div>
        </aside>

        <div className="prose-field max-w-reading min-w-0 lg:col-start-1 lg:row-start-1">
          {content}
        </div>
      </div>

      {project.gallery.length > 0 ? (
        <section
          aria-labelledby="gallery-heading"
          className="mx-auto max-w-site px-4 pb-20 sm:px-8 sm:pb-24"
        >
          <SectionHeading id="gallery-heading" title="Gallery" />
          <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {project.gallery.map((image) => (
              <li key={image.url}>
                <figure>
                  <div
                    className="relative overflow-hidden border border-line bg-deep"
                    style={{
                      aspectRatio:
                        image.width && image.height
                          ? `${image.width} / ${image.height}`
                          : "16 / 10",
                    }}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 1216px) 568px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  {image.caption ? (
                    <figcaption className="mt-3 font-mono text-micro tracking-[0.14em] text-faint uppercase">
                      {image.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Pager
        label="More projects"
        previous={
          previous
            ? {
                href: `/projects/${previous.slug}` as Route,
                title: previous.title,
                caption: "Previous project",
              }
            : null
        }
        next={
          next
            ? {
                href: `/projects/${next.slug}` as Route,
                title: next.title,
                caption: "Next project",
              }
            : null
        }
      />
    </article>
  );
}

function ProjectSpecs({
  project,
  year,
}: {
  project: ProjectDetail;
  year: string | null;
}) {
  const label = "font-mono text-micro tracking-[0.18em] text-faint uppercase";

  return (
    <dl className="grid gap-8 border-y border-line py-8 sm:grid-cols-2 lg:grid-cols-1">
      {year ? (
        <div>
          <dt className={label}>Year</dt>
          <dd className="mt-2 font-mono text-sm text-star">{year}</dd>
        </div>
      ) : null}

      {project.techStack.length > 0 ? (
        <div>
          <dt className={label}>Built with</dt>
          <dd className="mt-3">
            <ChipList items={project.techStack} label="Built with" />
          </dd>
        </div>
      ) : null}

      {project.tags.length > 0 ? (
        <div>
          <dt className={label}>Tags</dt>
          <dd className="mt-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {project.tags.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    href={`/projects?tag=${tag.slug}`}
                    className="inline-flex min-h-6 items-center text-sm text-dust underline decoration-flare/50 underline-offset-4 transition-colors duration-300 hover:text-star hover:decoration-flare"
                  >
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
