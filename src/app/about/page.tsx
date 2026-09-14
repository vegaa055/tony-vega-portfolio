import type { Metadata } from "next";
import Image from "next/image";

import { ChipList } from "@/components/chip-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Reticle } from "@/components/reticle";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/config/site";
import { getAboutPage } from "@/data/about";
import type { ExperienceEntry } from "@/db/schema";
import { renderMarkdown } from "@/lib/markdown/render";

export const metadata: Metadata = {
  title: "About",
  description: "About Tony Vega: background, skills, and experience.",
};

export default async function AboutPage() {
  const about = await getAboutPage();

  if (!about) {
    return (
      <>
        <PageHeader
          index="03"
          eyebrow="Observer"
          title="About"
          description="Background, skills, and experience."
        />
        <div className="mx-auto max-w-site px-4 py-16 sm:px-8 sm:py-20">
          <EmptyState title="Coming soon">
            This page is being written.
          </EmptyState>
        </div>
      </>
    );
  }

  const { content } = await renderMarkdown(about.bio);
  const work = about.experience.filter((entry) => entry.kind === "work");
  const education = about.experience.filter(
    (entry) => entry.kind === "education",
  );

  return (
    <>
      <PageHeader
        index="03"
        eyebrow="Observer"
        title="About"
        description={about.headline || undefined}
      />

      <div className="mx-auto grid max-w-site gap-12 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          {about.portrait ? (
            <div className="relative max-w-72 p-3">
              <Reticle tone="accent" />
              <div className="relative aspect-square overflow-hidden bg-deep">
                <Image
                  src={about.portrait.url}
                  alt={about.portrait.alt}
                  fill
                  preload
                  sizes="264px"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[0.66rem] tracking-[0.16em] uppercase">
            {[
              { href: siteConfig.links.github, label: "GitHub" },
              { href: siteConfig.links.linkedin, label: "LinkedIn" },
            ].map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-dust transition-colors duration-300 hover:text-star"
                >
                  {link.label} <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="prose-field max-w-reading lg:col-span-8">{content}</div>
      </div>

      {about.skills.length > 0 ? (
        <section
          aria-labelledby="skills-heading"
          className="mx-auto max-w-site px-4 pb-16 sm:px-8 sm:pb-24"
        >
          <SectionHeading id="skills-heading" index="01" title="Skills" />
          <dl className="reading-backdrop mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {about.skills.map((group) => (
              <div key={group.label}>
                <dt className="font-mono text-[0.62rem] tracking-[0.18em] text-faint uppercase">
                  {group.label}
                </dt>
                <dd className="mt-4">
                  <ChipList items={group.items} label={group.label} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {about.experience.length > 0 ? (
        <section
          aria-labelledby="experience-heading"
          className="mx-auto max-w-site px-4 pb-24 sm:px-8"
        >
          <SectionHeading
            id="experience-heading"
            index="02"
            title="Experience"
          />
          <div className="reading-backdrop mt-10 grid gap-14 lg:grid-cols-2 lg:gap-8">
            <Timeline title="Work" entries={work} />
            <Timeline title="Education" entries={education} />
          </div>
        </section>
      ) : null}
    </>
  );
}

function Timeline({
  title,
  entries,
}: {
  title: string;
  entries: ExperienceEntry[];
}) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="font-mono text-[0.62rem] tracking-[0.18em] text-faint uppercase">
        {title}
      </h3>
      <ol className="mt-6 border-l border-line">
        {entries.map((entry) => (
          <li
            key={`${entry.organization}-${entry.role}-${entry.period}`}
            className="relative pb-10 pl-6 last:pb-0"
          >
            {/* A marker on the timeline, like a planet on its orbit. */}
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-[3.5px] size-1.5 rounded-full bg-flare shadow-[0_0_8px_1px_rgb(255_106_77/0.5)]"
            />
            <p className="font-mono text-[0.6rem] tracking-[0.16em] text-faint uppercase">
              {entry.period}
            </p>
            <h4 className="mt-2 text-lg font-medium tracking-tight text-star">
              {entry.role}
            </h4>
            <p className="text-dust">{entry.organization}</p>
            {entry.description ? (
              <p className="mt-3 leading-relaxed text-dust">
                {entry.description}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
