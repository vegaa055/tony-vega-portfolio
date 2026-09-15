import { sections, siteConfig } from "@/config/site";
import { OG_SIZE, renderCard } from "@/lib/og/card";

const { index, eyebrow, title, description } = sections.blog;

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${siteConfig.name}'s blog`;

/** The share image for the blog index. */
export default function Image() {
  return renderCard({ kicker: `${index} / ${eyebrow}`, title, description });
}
