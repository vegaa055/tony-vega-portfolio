import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { ADMIN_STORAGE_STATE, E2E_BASE_URL, SAMPLE_IMAGE } from "./env";
import {
  choosePublished,
  deleteFromEditor,
  field,
  saveButton,
} from "./helpers";

test.use({ storageState: ADMIN_STORAGE_STATE });

test("a featured project with a cover and gallery", async ({ page }) => {
  const image = await readFile(SAMPLE_IMAGE);

  await page.goto("/admin/projects/new");
  await field(page, "Title").fill("Tested project");
  await field(page, "Tagline").fill("Made by the end-to-end tests.");
  await page.getByRole("checkbox", { name: /Feature this project/ }).check();

  const tags = field(page, "Tags");
  await tags.fill("Testing");
  await tags.press("Enter");
  await expect(
    page.getByRole("button", { name: "Remove Testing" }),
  ).toBeVisible();

  // Cover image: after uploading, the description field gets focus.
  const cover = page.getByRole("group", { name: /Cover image/ });
  await cover.locator('input[type="file"]').setInputFiles(SAMPLE_IMAGE);
  const coverDescription = field(page, "Description (alt text)");
  await expect(coverDescription).toBeFocused();
  await coverDescription.fill("A cover made by a test");

  const gallery = page.getByRole("group", { name: /^Gallery/ });
  await gallery.locator('input[type="file"]').setInputFiles([
    { name: "first.webp", mimeType: "image/webp", buffer: image },
    { name: "second.webp", mimeType: "image/webp", buffer: image },
  ]);
  await expect(
    page.getByText("Added 2 images. Describe each one below."),
  ).toBeVisible();
  await field(page, "Image 1 description").fill("First gallery image");
  await field(page, "Image 2 description").fill("Second gallery image");
  await page.getByRole("button", { name: "Move image 2 earlier" }).click();
  await expect(field(page, "Image 1 description")).toHaveValue(
    "Second gallery image",
  );

  await choosePublished(page);
  await saveButton(page).click();
  await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/);
  await expect(
    page.getByText("Saved. The live page is updated."),
  ).toBeVisible();

  // The public page shows the images, in order, and they actually load.
  await page.goto("/projects/tested-project");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tested project" }),
  ).toBeVisible();
  const coverImage = page.getByRole("img", { name: "A cover made by a test" });
  await expect(coverImage).toBeVisible();
  await expect
    .poll(() =>
      coverImage.evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  const alts = await page
    .getByRole("main")
    .locator("img[alt]")
    .evaluateAll((images) => images.map((img) => img.getAttribute("alt")));
  expect(alts.indexOf("Second gallery image")).toBeLessThan(
    alts.indexOf("First gallery image"),
  );

  // Featured projects appear on the home page.
  await page.goto("/");
  await expect(
    page
      .getByRole("region", { name: "Selected work" })
      .getByRole("link", { name: "Tested project" }),
  ).toBeVisible();

  await page.goto("/admin");
  await page.getByRole("link", { name: "Tested project", exact: true }).click();
  await deleteFromEditor(page, "Delete project");
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Tested project" })).toHaveCount(
    0,
  );
});

test("a web address must be a full https link", async ({ page }) => {
  await page.goto("/admin/projects/new");
  await field(page, "Title").fill("Bad link project");
  await field(page, "Live site").fill("not a url");
  await saveButton(page).click();

  const liveSite = field(page, "Live site");
  await expect(liveSite).toBeFocused();
  await expect(liveSite).toHaveAccessibleDescription(
    "Enter a full address, starting with https://",
  );
});

test("uploads need a signed-in admin and a real image", async ({
  page,
  playwright,
}) => {
  const fake = {
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("definitely not an image"),
  };
  const headers = { origin: E2E_BASE_URL };

  // Explicitly empty: a new request context otherwise picks up this file's
  // saved admin session.
  const visitor = await playwright.request.newContext({
    baseURL: E2E_BASE_URL,
    storageState: { cookies: [], origins: [] },
  });
  const signedOut = await visitor.post("/api/uploads/local", {
    multipart: { file: fake },
    headers,
  });
  expect(signedOut.status()).toBe(401);
  await visitor.dispose();

  const signedIn = await page.request.post("/api/uploads/local", {
    multipart: { file: fake },
    headers,
  });
  expect(signedIn.status()).toBe(415);
  expect(await signedIn.json()).toEqual({
    error: "That file isn't a valid image.",
  });

  // The file route only serves names the upload route made.
  const sneaky = await page.request.get("/uploads/..%2F..%2Fpackage.json");
  expect(sneaky.status()).toBe(404);
});
