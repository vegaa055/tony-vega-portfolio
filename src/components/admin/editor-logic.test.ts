import { redirect } from "next/navigation";
import { describe, expect, it } from "vitest";

import { runAction } from "./run-action";
import {
  carriedSavedMessage,
  carrySavedMessage,
  clearCarriedSavedMessage,
} from "./saved-message";
import { mergeSavedChanges } from "./saved-values";

describe("mergeSavedChanges", () => {
  const sent = { title: "Draft", publishedAt: "" };

  it("takes the values the server filled in", () => {
    expect(
      mergeSavedChanges(sent, sent, { publishedAt: "2026-09-15" }),
    ).toEqual({ title: "Draft", publishedAt: "2026-09-15" });
  });

  it("keeps anything typed while the save was running", () => {
    const current = { title: "Draft, edited meanwhile", publishedAt: "" };
    expect(
      mergeSavedChanges(current, sent, { publishedAt: "2026-09-15" }),
    ).toEqual({ title: "Draft, edited meanwhile", publishedAt: "2026-09-15" });
  });

  it("doesn't overwrite a field that was itself edited meanwhile", () => {
    const current = { title: "Draft", publishedAt: "2020-01-01" };
    expect(
      mergeSavedChanges(current, sent, { publishedAt: "2026-09-15" }),
    ).toEqual(current);
  });
});

describe("carried saved message", () => {
  it("is only shown on the page it was carried to", () => {
    carrySavedMessage("/admin/posts/1", "Saved as a draft.");
    expect(carriedSavedMessage("/admin/posts/2")).toBeNull();
    expect(carriedSavedMessage("/admin/posts/1")).toBe("Saved as a draft.");
  });

  it("is cleared once that page has shown it", () => {
    carrySavedMessage("/admin/posts/1", "Saved as a draft.");
    clearCarriedSavedMessage("/admin/posts/2");
    expect(carriedSavedMessage("/admin/posts/1")).toBe("Saved as a draft.");
    clearCarriedSavedMessage("/admin/posts/1");
    expect(carriedSavedMessage("/admin/posts/1")).toBeNull();
  });
});

describe("runAction", () => {
  it("passes results through", async () => {
    await expect(runAction(async () => ({ ok: true }))).resolves.toEqual({
      ok: true,
    });
  });

  it("turns a failed request into a message instead of an error", async () => {
    const result = await runAction(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(result).toMatchObject({ ok: false });
    expect("message" in result && result.message).toContain(
      "Couldn't reach the server",
    );
  });

  it("lets redirects through", async () => {
    await expect(
      runAction(async () => {
        redirect("/admin/login");
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
  });
});
