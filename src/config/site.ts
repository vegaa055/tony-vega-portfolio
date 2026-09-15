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

export const siteConfig = {
  name: "Tony Vega",
  role: "Software developer",
  description:
    "Tony Vega builds interactive simulations, software synthesizers, and web applications.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
