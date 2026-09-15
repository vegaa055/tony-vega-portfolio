"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClass } from "@/components/button-link";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "pending" | "failed">("idle");

  async function signOut() {
    setState("pending");
    const { error } = await authClient.signOut();
    // Stay put if it didn't work, rather than showing a login page while
    // still signed in.
    if (error) return setState("failed");
    router.replace("/admin/login");
    router.refresh();
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
