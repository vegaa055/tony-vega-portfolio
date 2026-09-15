import { expect, test } from "@playwright/test";

// The public site, as a visitor sees it, with the seed content.

test("home page shows featured projects and the latest writing", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tony");

  const featured = page.getByRole("region", { name: "Selected work" });
  for (const title of ["3D Solar System", "Vision Quest", "Astral Vega"]) {
    await expect(featured.getByRole("link", { name: title })).toBeVisible();
  }

  const writing = page.getByRole("region", { name: "Latest writing" });
  await expect(
    writing.getByRole("link", { name: "Rebuilding my portfolio from scratch" }),
  ).toBeVisible();
});

test("projects page filters by tag and keeps the tag in the address", async ({
  page,
}) => {
  await page.goto("/projects");
  const projects = page.getByRole("main").getByRole("article");
  await expect(projects.first()).toBeVisible();
  const total = await projects.count();

  const filters = page.getByRole("group", { name: "Filter projects by tag" });
  const audio = filters.getByRole("button", { name: /^Audio/ });
  await audio.click();

  await expect(audio).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/\?tag=audio$/);
  const count = Number(
    (await audio.innerText()).match(/\d+/)?.[0] ?? Number.NaN,
  );
  await expect(projects).toHaveCount(count);

  // The filter survives a reload.
  await page.reload();
  await expect(projects).toHaveCount(count);

  await filters.getByRole("button", { name: /^All/ }).click();
  await expect(projects).toHaveCount(total);
  await expect(page).toHaveURL(/\/projects$/);
});

test("project page shows the write-up and links onward", async ({ page }) => {
  await page.goto("/projects/3d-solar-system");
  await expect(
    page.getByRole("heading", { level: 1, name: "3D Solar System" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open live site/ }),
  ).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
});

test("blog lists the published post, and its page renders", async ({
  page,
}) => {
  await page.goto("/blog");
  await page
    .getByRole("link", { name: "Rebuilding my portfolio from scratch" })
    .click();

  await expect(page).toHaveURL(/\/blog\/rebuilding-my-portfolio$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Rebuilding my portfolio from scratch",
    }),
  ).toBeVisible();
});

test("about page shows the bio and experience", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("img").first()).toBeVisible();
});

test("no page scrolls sideways at tablet and laptop widths", async ({
  page,
}) => {
  // Phones are covered in mobile.spec.ts. In between, the page's side padding
  // is at its widest while there's no margin around the content yet.
  for (const width of [768, 1024, 1180]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/projects",
      "/projects/3d-solar-system",
      "/blog",
      "/blog/rebuilding-my-portfolio",
      "/about",
    ]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `${path} at ${width}px`).toBe(0);
    }
  }
});

test("drafts and missing items show the not-found page, hidden from search", async ({
  page,
  request,
}) => {
  // Project and post pages that weren't built ahead of time start streaming
  // before they know the item is missing, so the status stays 200. Next.js
  // marks them noindex instead (a "soft 404"). See docs/PLAN.md.
  for (const path of [
    "/projects/space-force",
    "/blog/why-i-keep-rebuilding",
    "/projects/no-such-project",
    "/blog/no-such-post",
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { level: 1, name: "Signal lost" }),
      path,
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    // Nothing from the draft itself is sent.
    expect(await page.content()).not.toMatch(
      /Space Force|Why I keep rebuilding/,
    );
  }

  // Addresses outside those sections get a real 404 status.
  expect((await request.get("/no-such-page")).status()).toBe(404);
});
