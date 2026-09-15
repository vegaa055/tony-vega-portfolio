import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";

// Nothing in the panel renders before the session check. Entering the panel
// waits for it here; moving between admin pages shows loading.tsx while the
// next page checks. Next.js's dev-time instant-navigation check doesn't count
// that loading state, so this layout and every page under it opt out.
export const instant = false;

// Layouts don't re-render on client navigation, so this check alone isn't
// enough: every page and Server Action under here calls requireAdmin() too.
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
