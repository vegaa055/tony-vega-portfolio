import { sections, siteConfig } from "@/config/site";
import { getAboutPage } from "@/data/about";
import { OG_SIZE, renderCard } from "@/lib/og/card";

const { index, eyebrow, title, description } = sections.about;

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `About ${siteConfig.name}`;

/** The share image for the About page, with the portrait when there is one. */
export default async function Image() {
  const about = await getAboutPage();
  return renderCard({
    kicker: `${index} / ${eyebrow}`,
    title,
    description: about?.headline || description,
    imageUrl: about?.portrait?.url,
  });
}
