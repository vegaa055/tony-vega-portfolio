import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";

// Layouts don't re-render on client navigation, so this check alone isn't
// enough: every page and Server Action under here calls requireAdmin() too.
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
