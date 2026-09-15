import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from ".";

/**
 * The signed-in session, or null. Deduplicated per request, so the layout and
 * the page can both ask without a second database lookup.
 *
 * A session only exists after the two-factor step (when it's enabled), so a
 * half-finished login never counts as signed in.
 */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  twoFactorEnabled: boolean;
};

/**
 * The signed-in admin, or null. Editor actions use this to report "signed out"
 * instead of redirecting, because a redirect would throw away unsaved work.
 */
export async function getAdmin(): Promise<AdminUser | null> {
  const session = await getSession();
  if (!session) return null;

  const { id, name, email, twoFactorEnabled } = session.user;
  return { id, name, email, twoFactorEnabled: Boolean(twoFactorEnabled) };
}

/**
 * Call at the top of every admin page and Server Action (or getAdmin, for
 * editor actions). Hiding UI is not protection: each entry point checks the
 * session for itself.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
