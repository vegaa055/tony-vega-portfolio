import Link from "next/link";

import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { OrbitMark } from "@/components/orbit-mark";
import type { AdminUser } from "@/lib/auth/session";

type AdminShellProps = {
  user: AdminUser;
  children: React.ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-void/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-site items-center gap-4 px-4 sm:gap-8 sm:px-8">
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2.5 font-mono text-[0.66rem] tracking-[0.18em] text-star uppercase"
          >
            <OrbitMark className="size-5 text-dust" />
            Admin
          </Link>

          <nav aria-label="Admin" className="h-full">
            <ul className="flex h-full items-stretch">
              <li className="flex">
                <AdminNavLink href="/admin" exact>
                  Content
                </AdminNavLink>
              </li>
              <li className="flex">
                <AdminNavLink href="/admin/about">About page</AdminNavLink>
              </li>
              <li className="flex">
                <AdminNavLink href="/admin/security">Security</AdminNavLink>
              </li>
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden font-mono text-[0.62rem] tracking-[0.14em] text-dust uppercase transition-colors hover:text-star sm:inline"
            >
              View site <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <span className="hidden text-sm text-faint lg:inline">
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {user.twoFactorEnabled ? null : (
        <div className="border-b border-flare/30 bg-flare/10">
          <p className="mx-auto max-w-site px-4 py-2.5 text-sm text-star sm:px-8">
            Two-factor login is off, so your password alone protects this site.{" "}
            <Link
              href="/admin/security"
              className="text-flare-soft underline underline-offset-4 hover:text-flare"
            >
              Set it up
            </Link>
          </p>
        </div>
      )}

      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-site flex-1 px-4 py-10 outline-none sm:px-8 sm:py-14"
      >
        {children}
      </main>
    </>
  );
}
