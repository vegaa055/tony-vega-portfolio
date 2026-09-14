import { HeroPlaceholder } from "./hero-placeholder";

/**
 * The home page hero slot.
 *
 * Today it renders a CSS-only orrery. When the WebGPU scene is ready, load it
 * here through a client component using next/dynamic with `ssr: false`, and
 * keep <HeroPlaceholder /> as the loading state and the fallback for browsers
 * without WebGPU/WebGL or visitors who prefer reduced motion.
 */
export function HeroScene() {
  return <HeroPlaceholder />;
}
