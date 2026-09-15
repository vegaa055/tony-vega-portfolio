import { siteConfig } from "@/config/site";
import { OG_SIZE, renderCard } from "@/lib/og/card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${siteConfig.name}, ${siteConfig.role.toLowerCase()}`;

/** The home page's share image. */
export default function Image() {
  return renderCard({
    kicker: siteConfig.role,
    title: siteConfig.name,
    description: siteConfig.description,
  });
}
