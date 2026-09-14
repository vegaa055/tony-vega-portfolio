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
  },
};
