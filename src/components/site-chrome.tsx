import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Starfield } from "@/components/starfield";

/** The public site's frame: starfield, header, main content, footer. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Starfield />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
