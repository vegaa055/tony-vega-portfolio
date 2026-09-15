import { expect, test, type APIRequestContext } from "@playwright/test";

import { ADMIN_STORAGE_STATE, E2E_BASE_URL } from "./env";
import {
  choosePublished,
  createDraftPost,
  deleteFromEditor,
  saveButton,
} from "./helpers";

// What search engines, feed readers, and link previews see.

const site = (path: string) => new URL(path, E2E_BASE_URL).href;

const text = async (request: APIRequestContext, path: string) =>
  (await request.get(path)).text();

/** Checks that an address serves a 1200×630 PNG. */
async function expectShareCard(request: APIRequestContext, url: string) {
  const response = await request.get(url);
  expect(response.status(), url).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  // A PNG's width and height sit at bytes 16 and 20.
  const png = await response.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
}

test("robots.txt keeps crawlers out of the admin and links the sitemap", async ({
  request,
}) => {
  const robots = await text(request, "/robots.txt");
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain(`Sitemap: ${site("/sitemap.xml")}`);
});

test("the sitemap lists published pages, and never drafts", async ({
  request,
}) => {
  const sitemap = await text(request, "/sitemap.xml");
  for (const path of [
    "/",
    "/projects",
    "/projects/3d-solar-system",
    "/blog",
    "/blog/rebuilding-my-portfolio",
    "/about",
  ]) {
    expect(sitemap).toContain(`<loc>${site(path)}</loc>`);
  }
  expect(sitemap).not.toMatch(/space-force|why-i-keep-rebuilding/);
});

test("the feed is valid RSS with the published posts", async ({
  page,
  request,
}) => {
  const response = await request.get("/feed.xml");
  expect(response.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await response.text();

  // Parse it the way a feed reader would.
  await page.goto("/");
  const feed = await page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, "application/xml");
    return {
      error: doc.querySelector("parsererror")?.textContent ?? null,
      items: [...doc.querySelectorAll("item")].map((item) => ({
        title: item.querySelector("title")?.textContent,
        link: item.querySelector("link")?.textContent,
      })),
    };
  }, xml);

  expect(feed.error).toBeNull();
  expect(feed.items).toContainEqual({
    title: "Rebuilding my portfolio from scratch",
    link: site("/blog/rebuilding-my-portfolio"),
  });
  expect(xml).not.toContain("Why I keep rebuilding");
});

test("every public page has a canonical address, a share card, and a feed link", async ({
  page,
  request,
}) => {
  const pages = [
    { path: "/", type: "website", data: "WebSite" },
    { path: "/projects", type: "website" },
    {
      path: "/projects/3d-solar-system",
      type: "article",
      data: "SoftwareSourceCode",
    },
    { path: "/blog", type: "website" },
    {
      path: "/blog/rebuilding-my-portfolio",
      type: "article",
      data: "BlogPosting",
    },
    { path: "/about", type: "website", data: "ProfilePage" },
  ];

  for (const { path, type, data } of pages) {
    await page.goto(path);

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(new URL(canonical ?? "").href, path).toBe(site(path));
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      type,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(
      page.locator('link[rel="alternate"][type="application/rss+xml"]'),
    ).toHaveAttribute("href", site("/feed.xml"));

    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(image, path).toBeTruthy();
    await expectShareCard(request, image ?? "");

    // Structured data, where the page has some.
    const scripts = page.locator('script[type="application/ld+json"]');
    if (data) {
      const json = JSON.parse((await scripts.textContent()) ?? "");
      expect(json["@type"], path).toBe(data);
    } else {
      await expect(scripts).toHaveCount(0);
    }
  }
});

test.describe("publishing", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("a new post joins the feed and sitemap, with its own share card", async ({
    page,
    request,
  }) => {
    const editor = await createDraftPost(page, "Fresh from the tests");
    const path = "/blog/fresh-from-the-tests";
    expect(await text(request, "/feed.xml")).not.toContain(
      "Fresh from the tests",
    );

    await choosePublished(page);
    await saveButton(page).click();
    await expect(
      page.getByText("Saved. The live post is updated."),
    ).toBeVisible();

    await expect
      .poll(() => text(request, "/feed.xml"))
      .toContain("<title>Fresh from the tests</title>");
    await expect
      .poll(() => text(request, "/sitemap.xml"))
      .toContain(`<loc>${site(path)}</loc>`);

    await page.goto(path);
    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    await expectShareCard(request, image ?? "");

    await page.goto(editor);
    await deleteFromEditor(page, "Delete post");
    await expect
      .poll(() => text(request, "/feed.xml"))
      .not.toContain("Fresh from the tests");
    await expect
      .poll(() => text(request, "/sitemap.xml"))
      .not.toContain(site(path));
  });
});
