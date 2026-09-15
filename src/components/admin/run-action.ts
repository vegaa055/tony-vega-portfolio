import { unstable_rethrow } from "next/navigation";

import type { ActionFailure } from "@/app/admin/actions";

const UNREACHABLE: ActionFailure = {
  ok: false,
  message:
    "Not saved. Couldn't reach the server. Check your connection, then try again.",
};

/**
 * Calls a Server Action that returns a result. If the request itself fails
 * (a dropped connection, a server error), this returns a failure instead of
 * throwing, so an editor keeps its unsaved changes rather than showing an
 * error page. Redirects still go through.
 */
export async function runAction<Result extends { ok: boolean }>(
  action: () => Promise<Result>,
): Promise<Result | ActionFailure> {
  try {
    return await action();
  } catch (error) {
    unstable_rethrow(error);
    return UNREACHABLE;
  }
}
