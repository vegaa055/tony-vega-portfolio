import { expect, test, type Page } from "@playwright/test";

import { accessibilityProblems } from "./a11y";
import { ADMIN_STORAGE_STATE } from "./env";

// Runs in the "phone" project: a touch screen 320px wide, the narrowest width
// WCAG expects pages to work at without sideways scrolling. Animations are
// turned off, so axe never measures text mid-fade.
test.use({ reducedMotion: "reduce" });

/** Layout problems on a small screen, as lists that should all be empty. */
function layoutProblems(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) =>
      el.checkVisibility() && el.getBoundingClientRect().width > 0;
    const hasOwnText = (el: Element) =>
      [...el.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
    const describe = (el: Element) =>
      (el.getAttribute("aria-label") ?? el.textContent ?? el.tagName)
        .trim()
        .slice(0, 40);

    const smallText = [...document.body.querySelectorAll("*")]
      .filter(
        (el) =>
          visible(el) &&
          hasOwnText(el) &&
          !el.closest("[aria-hidden='true']") &&
          Number.parseFloat(getComputedStyle(el).fontSize) < 12,
      )
      .map(describe);

    const smallTargets = [
      ...document.querySelectorAll("a, button, input, select, textarea"),
    ]
      .filter(
        (el) =>
          visible(el) &&
          !el.classList.contains("sr-only") &&
          // Links within sentences are sized by the text around them.
          !el.closest("p, .prose-field") &&
          // A checkbox inside its label is tapped through the whole label.
          !(el.matches("[type=checkbox], [type=radio]") && el.closest("label")),
      )
      .filter((el) => {
        const box = el.getBoundingClientRect();
        return box.width < 24 || box.height < 24;
      })
      .map(describe);

    return {
      sidewaysScrolling:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      smallText,
      smallTargets,
    };
  });
}

const noProblems = { sidewaysScrolling: 0, smallText: [], smallTargets: [] };

for (const path of [
  "/",
  "/projects",
  "/projects/3d-solar-system",
  "/blog",
  "/blog/rebuilding-my-portfolio",
  "/about",
  "/no-such-page",
]) {
  test(`${path} works on a small phone`, async ({ page }) => {
    await page.goto(path);
    expect(await layoutProblems(page)).toEqual(noProblems);
    expect(await accessibilityProblems(page)).toEqual([]);
  });
}

test.describe("admin", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  for (const path of [
    "/admin",
    "/admin/posts/new",
    "/admin/projects/new",
    "/admin/about",
    "/admin/security",
  ]) {
    test(`${path} works on a small phone`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await layoutProblems(page)).toEqual(noProblems);
      expect(await accessibilityProblems(page)).toEqual([]);
    });
  }

  test("the navigation fits below the header", async ({ page }) => {
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Admin" });
    for (const name of ["Content", "About page", "Security"]) {
      await expect(nav.getByRole("link", { name })).toBeInViewport();
    }
    await expect(
      page.getByRole("button", { name: "Sign out" }),
    ).toBeInViewport();
  });
});
