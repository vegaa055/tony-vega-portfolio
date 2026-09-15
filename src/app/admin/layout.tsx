import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: `%s · Admin · ${siteConfig.name}`,
  },
  robots: { index: false, follow: false },
};

// Every admin page depends on who's signed in, so it renders on each request
// and waits for the session check. Opting out here skips the static-shell and
// instant-navigation checks for the whole admin area.
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-col bg-void">{children}</div>;
}
