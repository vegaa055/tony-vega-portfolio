import { ButtonLink } from "@/components/button-link";
import { EmptyState } from "@/components/empty-state";
import { HeroNebula } from "@/components/hero/hero-nebula";
import { JsonLd } from "@/components/json-ld";
import { PostList } from "@/components/post-list";
import { ProjectCard } from "@/components/project-card";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/config/site";
import { getLatestPosts } from "@/data/posts";
import { getFeaturedProjects, getPublishedProjects } from "@/data/projects";
import { displayFont } from "@/lib/fonts";
import { websiteJsonLd } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({ path: "/" });

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <section className="relative isolate overflow-hidden border-b border-line">
        <HeroNebula />
        <div className="relative mx-auto flex max-w-site flex-col px-4 pt-14 pb-52 sm:px-8 lg:min-h-[min(46rem,calc(100svh-4rem))] lg:justify-center lg:pt-20 lg:pb-24">
          <div className="max-w-[40rem]">
            <p className="flex animate-rise items-center gap-3 font-mono text-label tracking-[0.2em] text-dust uppercase">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-flare shadow-[0_0_12px_2px_rgb(255_106_77/0.6)]"
              />
              {siteConfig.role}
            </p>

            <h1
              className={`${displayFont.className} mt-7 animate-rise text-[clamp(2.75rem,8.2vw,5.6rem)] leading-[1.05] font-normal tracking-[-0.01em] [animation-delay:80ms]`}
            >
              Tony
              <br />
              <span className="relative ml-[0.85em] text-dust">
                Vega
                {/* Vega is also α Lyrae, one of the brightest stars in the sky.
                    The outer span keeps the heading's font size, so `top` in em
                    lines the tag up with the cap height at every screen size. */}
                <span
                  aria-hidden="true"
                  className="absolute top-[0.38em] -right-2 translate-x-full leading-none"
                >
                  <span className="block font-mono text-[0.6rem] tracking-[0.08em] text-flare sm:text-[0.7rem]">
                    α Lyr
                  </span>
                </span>
              </span>
            </h1>

            <p className="mt-8 max-w-[34rem] animate-rise text-lg leading-relaxed text-dust [animation-delay:160ms] sm:text-xl">
              Full-stack developer building simulations, games, audio software, and web apps.
            </p>

            <div className="mt-10 flex animate-rise flex-wrap items-center gap-3 [animation-delay:240ms]">
              <ButtonLink href="/projects">View projects</ButtonLink>
              <ButtonLink href="/about" variant="ghost">
                About me
              </ButtonLink>
            </div>
          </div>

          <p
            aria-hidden="true"
            className="absolute right-4 bottom-5 font-mono text-micro tracking-[0.16em] text-faint uppercase sm:right-8"
          >
            Fig. 01 — Nebula
          </p>
        </div>
      </section>

      <section
        aria-labelledby="featured-heading"
        className="mx-auto max-w-site px-4 py-16 sm:px-8 sm:py-24"
      >
        <SectionHeading
          id="featured-heading"
          index="01"
          title="Selected work"
          link={{ href: "/projects", label: "All projects" }}
        />
        <div className="mt-12">
          <FeaturedProjects />
        </div>
      </section>

      <section
        aria-labelledby="writing-heading"
        className="mx-auto max-w-site px-4 pb-24 sm:px-8"
      >
        <SectionHeading
          id="writing-heading"
          index="02"
          title="Latest writing"
          link={{ href: "/blog", label: "All posts" }}
        />
        <div className="mt-2">
          <LatestWriting />
        </div>
      </section>
    </>
  );
}

async function FeaturedProjects() {
  const [featured, all] = await Promise.all([
    getFeaturedProjects(),
    getPublishedProjects(),
  ]);

  if (featured.length === 0) {
    return (
      <EmptyState title="No projects published yet">
        Featured projects will appear here.
      </EmptyState>
    );
  }

  return (
    <ul className="grid gap-x-8 gap-y-16 sm:grid-cols-2">
      {featured.map((project) => (
        <li key={project.slug}>
          <ProjectCard
            project={project}
            // Same catalog number the project has on the projects page.
            position={all.findIndex((p) => p.slug === project.slug) + 1}
          />
        </li>
      ))}
    </ul>
  );
}

async function LatestWriting() {
  const posts = await getLatestPosts(3);

  if (posts.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title="No posts yet">
          New posts will appear here.
        </EmptyState>
      </div>
    );
  }

  return <PostList posts={posts} />;
}
