import { sections, siteConfig } from "@/config/site";
import { OG_SIZE, renderCard } from "@/lib/og/card";

const { index, eyebrow, title, description } = sections.projects;

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${title} by ${siteConfig.name}`;

/** The share image for the projects page. */
export default function Image() {
  return renderCard({ kicker: `${index} / ${eyebrow}`, title, description });
}
