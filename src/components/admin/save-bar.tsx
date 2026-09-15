import clsx from "clsx";

import type { ActionFailure } from "@/app/admin/actions";
import { buttonClass } from "@/components/button-link";

type SaveBarProps = {
  saving: boolean;
  dirty: boolean;
  /** Shown after a successful save, until the next change. */
  savedMessage: string | null;
  /** Why the last save didn't work. Cleared by the next successful save. */
  failure?: ActionFailure | null;
  /** The public page, when there is one to view. */
  viewHref?: string | null;
  /** Extra actions, like delete. */
  children?: React.ReactNode;
};

/**
 * Sticks to the bottom of the screen while editing, so the result of saving
 * is always in view, however far down the form the Save button was pressed.
 */
export function SaveBar({
  saving,
  dirty,
  savedMessage,
  failure,
  viewHref,
  children,
}: SaveBarProps) {
  const problem = saving ? null : failure;
  const status = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : (savedMessage ?? "No changes");

  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-14 border-t border-line bg-void/95 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <p
          role="status"
          className={clsx(
            "flex items-center gap-2 text-sm",
            problem
              ? "text-flare-soft"
              : dirty && !saving
                ? "text-star"
                : "text-dust",
          )}
        >
          <span
            aria-hidden="true"
            className={clsx(
              "size-1.5 shrink-0 rounded-full",
              problem || dirty || saving ? "bg-flare" : "bg-line-strong",
            )}
          />
          {problem ? (
            <span>
              {problem.message}
              {problem.signedOut ? (
                <>
                  {" "}
                  <a
                    href="/admin/login"
                    target="_blank"
                    rel="noreferrer"
                    className="text-star underline decoration-flare/60 underline-offset-4 hover:decoration-flare"
                  >
                    Sign in again
                    <span aria-hidden="true"> ↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  , then save.
                </>
              ) : null}
            </span>
          ) : (
            <span>{status}</span>
          )}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
          {viewHref ? (
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("quiet", "sm")}
            >
              View <span aria-hidden="true">↗</span>
              <span className="sr-only">
                {" "}
                the public page (opens in a new tab)
              </span>
            </a>
          ) : null}
          {children}
          <button
            type="submit"
            disabled={saving}
            className={buttonClass("primary", "sm")}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
