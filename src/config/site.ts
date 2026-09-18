import type { Route } from "next";

type NavItem = {
  href: Route;
  label: string;
};

const nav: NavItem[] = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

/**
 * The site's own address, used for absolute links, metadata, and the admin
 * login's origin checks. NEXT_PUBLIC_SITE_URL is set for the live site only,
 * so Vercel preview deployments fall back to their own address.
 */
function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const preview =
    process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL;
  return preview ? `https://${preview}` : "http://localhost:3000";
}

export const siteConfig = {
  name: "Tony Vega",
  role: "Full-stack developer",
  description:
    "Tony Vega builds interactive simulations, software synthesizers, and web applications.",
  url: siteUrl(),
  nav,
  links: {
    github: "https://github.com/vegaa055",
    linkedin: "https://www.linkedin.com/in/tonyvega1983/",
  },
};

/** The headers of the section pages, also used on their share images. */
export const sections = {
  projects: {
    index: "01",
    eyebrow: "Catalog",
    title: "Projects",
    description:
      "Simulations, audio software, and web apps, with notes on how each one works.",
  },
  blog: {
    index: "02",
    eyebrow: "Log",
    title: "Blog",
    description:
      "Notes on building things: what worked, what broke, and what it taught.",
  },
  about: {
    index: "03",
    eyebrow: "Observer",
    title: "About",
    description: "Background, skills, and experience.",
  },
};
