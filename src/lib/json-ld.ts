import { siteConfig } from "@/config/site";
import type { PostDetail } from "@/data/posts";
import type { ProjectDetail } from "@/data/projects";
import type { AboutPage } from "@/db/schema";

// Structured data (schema.org, as JSON-LD) tells search engines what a page
// is about: who wrote it, when, and what it shows. Fields that are undefined
// are left out of the JSON.

const absolute = (path: string) => new URL(path, siteConfig.url).href;

/** Tony, the author of everything on the site. */
function person() {
  return {
    "@type": "Person",
    name: siteConfig.name,
    url: absolute("/about"),
    jobTitle: siteConfig.role,
    sameAs: [siteConfig.links.github, siteConfig.links.linkedin],
  };
}

/** For the home page. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absolute("/"),
    description: siteConfig.description,
    inLanguage: "en-US",
    author: person(),
  };
}

/** For the About page. */
export function profilePageJsonLd(
  about: Pick<AboutPage, "headline" | "portrait" | "updatedAt">,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absolute("/about"),
    dateModified: about.updatedAt.toISOString(),
    mainEntity: {
      ...person(),
      description: about.headline || undefined,
      image: about.portrait ? absolute(about.portrait.url) : undefined,
    },
  };
}

/** For a blog post. */
export function blogPostingJsonLd(post: PostDetail) {
  const url = absolute(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    url,
    mainEntityOfPage: url,
    image: post.coverImage ? absolute(post.coverImage.url) : undefined,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: person(),
    keywords: post.tags.map((tag) => tag.name).join(", ") || undefined,
    inLanguage: "en-US",
  };
}

/** For a project page. */
export function projectJsonLd(project: ProjectDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: project.title,
    description: project.summary || project.tagline || undefined,
    url: absolute(`/projects/${project.slug}`),
    image: project.coverImage ? absolute(project.coverImage.url) : undefined,
    codeRepository: project.repoUrl ?? undefined,
    datePublished: project.publishedAt?.toISOString(),
    dateModified: project.updatedAt.toISOString(),
    author: person(),
    keywords:
      [...project.techStack, ...project.tags.map((tag) => tag.name)].join(
        ", ",
      ) || undefined,
  };
}

/**
 * JSON for a <script type="application/ld+json"> tag. "<" is escaped so text
 * like "</script>" in a title can't end the tag early.
 */
export function serializeJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
