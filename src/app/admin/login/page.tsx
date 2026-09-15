import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { OrbitMark } from "@/components/orbit-mark";
import { Reticle } from "@/components/reticle";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

// Waits for the session check, so a signed-in admin goes straight to the
// dashboard instead of seeing the form first.
export const instant = false;

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");

  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex flex-1 items-center justify-center px-4 py-16 outline-none"
    >
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-2.5 font-mono text-[0.7rem] tracking-[0.18em] text-star uppercase"
        >
          <OrbitMark className="size-6 text-dust" />
          Tony Vega
        </Link>

        <div className="relative mt-10 border border-line bg-deep/60 px-6 py-8 sm:px-8">
          <Reticle tone="accent" className="-m-px" />
          <h1 className="font-mono text-lg font-light tracking-tight text-star font-stretch-semi-expanded">
            Admin sign in
          </h1>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
