"use client";

import { useRouter } from "next/navigation";
import { Fragment } from "react";

/**
 * Next.js keeps the last few visited pages mounted (hidden) and restores their
 * state when you return. For an editor that's right after Back or Forward, but
 * opening it from a link should always start from what's saved. Otherwise
 * "New post" could reopen the post you just created.
 *
 * bfcacheId changes on link and redirect navigations only (not on Back,
 * Forward, or the refresh after a save), so keying on it resets the editor
 * exactly when it should.
 */
export function ResetOnNavigation({ children }: { children: React.ReactNode }) {
  const { bfcacheId } = useRouter();
  return <Fragment key={bfcacheId}>{children}</Fragment>;
}
