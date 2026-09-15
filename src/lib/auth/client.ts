import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const NETWORK_ERROR = "NETWORK_ERROR";

/**
 * Browser-side auth calls. Login and two-factor go through these (and so
 * through /api/auth) rather than Server Actions, because Better Auth's rate
 * limiter only runs on HTTP requests to its endpoints.
 */
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
  fetchOptions: {
    // A dropped connection becomes an error result instead of an exception,
    // so forms show a message rather than getting stuck on "Signing in…".
    customFetchImpl: async (input, init) => {
      try {
        return await fetch(input, init);
      } catch {
        return Response.json({ code: NETWORK_ERROR }, { status: 503 });
      }
    },
  },
});

type AuthError = { status?: number; code?: string; message?: string } | null;

/**
 * A readable message for a failed auth call. `byCode` holds the messages for
 * the errors a form expects, like a wrong password.
 */
export function authErrorMessage(
  error: AuthError,
  byCode: Record<string, string> = {},
) {
  if (error?.code && byCode[error.code]) return byCode[error.code];
  if (error?.code === NETWORK_ERROR) {
    return "Couldn't reach the server. Check your connection, then try again.";
  }
  if (error?.status === 429) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  return error?.message ?? "Something went wrong. Please try again.";
}
