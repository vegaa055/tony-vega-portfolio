import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: `%s · Admin · ${siteConfig.name}`,
  },
  robots: { index: false, follow: false },
};

// Admin pages depend on who's signed in, so they render on each request. This
// skips the static-shell check for the admin area and lets navigations into it
// wait for the session check. Navigations inside the admin are covered by
// (panel)/layout.tsx, (panel)/loading.tsx, and login/page.tsx.
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-col bg-void">{children}</div>;
}
