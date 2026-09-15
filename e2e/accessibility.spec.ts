import { expect, test, type Page } from "@playwright/test";

import { accessibilityProblems, tabToNext, type FocusStop } from "./a11y";
import { ADMIN_STORAGE_STATE, clientIp, E2E_ADMIN } from "./env";
import { createDraftPost, field, saveButton } from "./helpers";

// Automated WCAG checks with axe, and walking through pages with the keyboard.
// Animations are turned off, so axe never measures text mid-fade.
test.use({ reducedMotion: "reduce" });

/** Tabs through the page from where focus is now, and lists every stop. */
async function tabThrough(page: Page) {
  const stops: FocusStop[] = [];
  for (let count = 0; count < 100; count++) {
    const stop = await tabToNext(page);
    // Focus left the page, or wrapped around to the start.
    if (!stop || (count > 0 && stop.name === stops[0].name)) break;
    stops.push(stop);
  }
  return stops;
}

/** Stops where focus can't be seen: no outline, or something on top of it. */
const hiddenFocus = (stops: FocusStop[]) =>
  stops.filter((stop) => !stop.showsFocus || stop.covered);

test.describe("public pages", () => {
  for (const path of [
    "/",
    "/projects",
    "/projects?tag=audio",
    "/projects/3d-solar-system",
    "/blog",
    "/blog/rebuilding-my-portfolio",
    "/about",
    "/no-such-page",
    "/projects/no-such-project",
  ]) {
    test(`${path} passes axe`, async ({ page }) => {
      await page.goto(path);
      expect(await accessibilityProblems(page)).toEqual([]);
    });
  }

  test("the skip link comes first and moves focus to the content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();

    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "View projects" }),
    ).toBeFocused();
  });

  for (const path of ["/", "/projects/3d-solar-system", "/about"]) {
    test(`focus is always visible when tabbing through ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      const stops = await tabThrough(page);
      expect(stops.length).toBeGreaterThan(5);
      expect(hiddenFocus(stops)).toEqual([]);
    });
  }

  test("the project filter works from the keyboard", async ({ page }) => {
    await page.goto("/projects");
    const filters = page.getByRole("group", { name: "Filter projects by tag" });
    const all = filters.getByRole("button", { name: /^All/ });
    const audio = filters.getByRole("button", { name: /^Audio/ });

    await audio.focus();
    await page.keyboard.press("Enter");
    await expect(audio).toHaveAttribute("aria-pressed", "true");

    await all.focus();
    await page.keyboard.press("Space");
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await expect(audio).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("signing in", () => {
  test.use({ extraHTTPHeaders: clientIp(12) });

  test("works with the keyboard alone", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(accessibilityProblems(page)).resolves.toEqual([]);

    const email = field(page, "Email");
    for (let count = 0; count < 5; count++) {
      await page.keyboard.press("Tab");
      if (await email.evaluate((input) => input === document.activeElement)) {
        break;
      }
    }
    await expect(email).toBeFocused();
    await page.keyboard.type(E2E_ADMIN.email);
    await page.keyboard.press("Tab");
    await expect(field(page, "Password")).toBeFocused();
    await page.keyboard.type(E2E_ADMIN.password);
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("heading", { level: 1, name: "Content" }),
    ).toBeVisible();
  });
});

test.describe("admin pages", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  for (const path of [
    "/admin",
    "/admin/posts/new",
    "/admin/projects/new",
    "/admin/about",
    "/admin/security",
  ]) {
    test(`${path} passes axe`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await accessibilityProblems(page)).toEqual([]);
    });
  }

  test("an editor passes axe with errors showing and with a preview", async ({
    page,
  }) => {
    await page.goto("/admin/posts/new");
    await saveButton(page).click();
    await expect(
      page.getByText("Not saved. Fix the highlighted fields."),
    ).toBeVisible();
    expect(await accessibilityProblems(page)).toEqual([]);

    // On a wide screen the preview shows beside the text.
    await field(page, "Post").fill(
      "## A heading\n\nSome `code`, a [link](https://example.com), and a list:\n\n- one\n- two",
    );
    await expect(
      page.getByRole("heading", { level: 2, name: "A heading" }),
    ).toBeVisible();
    expect(await accessibilityProblems(page)).toEqual([]);
  });

  for (const path of [
    "/admin/projects/new",
    "/admin/about",
    "/admin/security",
  ]) {
    test(`focus is always visible when tabbing through ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const stops = await tabThrough(page);
      expect(stops.length).toBeGreaterThan(5);
      expect(hiddenFocus(stops)).toEqual([]);
    });
  }

  test("the delete dialog starts on Cancel and closes with Escape", async ({
    page,
  }) => {
    await createDraftPost(page, "Kept by the keyboard test");
    // Reload, so only this page is in the document.
    await page.reload();

    const trigger = page.getByRole("button", { name: "Delete", exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    expect(await accessibilityProblems(page)).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
