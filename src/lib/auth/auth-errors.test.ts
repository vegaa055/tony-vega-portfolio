import { describe, expect, it } from "vitest";

import { authErrorMessage } from "./client";

describe("authErrorMessage", () => {
  it("uses the form's own message for errors it expects", () => {
    expect(
      authErrorMessage(
        { status: 401, code: "INVALID_EMAIL_OR_PASSWORD", message: "raw" },
        { INVALID_EMAIL_OR_PASSWORD: "That email and password don't match." },
      ),
    ).toBe("That email and password don't match.");
  });

  it("explains a dropped connection", () => {
    expect(authErrorMessage({ status: 503, code: "NETWORK_ERROR" })).toContain(
      "Couldn't reach the server",
    );
  });

  it("explains rate limiting", () => {
    expect(authErrorMessage({ status: 429 })).toBe(
      "Too many attempts. Wait a minute, then try again.",
    );
  });

  it("falls back to the server's message, then a generic one", () => {
    expect(authErrorMessage({ status: 400, message: "Bad request" })).toBe(
      "Bad request",
    );
    expect(authErrorMessage(null)).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
