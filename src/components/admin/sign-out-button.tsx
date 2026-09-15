"use client";

import { useState } from "react";

import { buttonClass } from "@/components/button-link";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const [state, setState] = useState<"idle" | "pending" | "failed">("idle");

  async function signOut() {
    setState("pending");
    const { error } = await authClient.signOut();
    // Stay put if it didn't work, rather than showing a login page while
    // still signed in.
    if (error) return setState("failed");
    // A full page load on purpose, not a client navigation: it clears the
    // admin pages Next.js keeps in memory, so Back can't bring one up.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/admin/login");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={state === "pending"}
      className={buttonClass("quiet", "sm")}
    >
      {state === "pending"
        ? "Signing out…"
        : state === "failed"
          ? "Sign-out failed. Retry"
          : "Sign out"}
    </button>
  );
}
