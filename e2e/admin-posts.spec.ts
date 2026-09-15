import { expect, test } from "@playwright/test";

import { ADMIN_STORAGE_STATE } from "./env";
import {
  choosePublished,
  createDraftPost,
  deleteFromEditor,
  field,
  saveButton,
} from "./helpers";

test.use({ storageState: ADMIN_STORAGE_STATE });

test("a post goes from draft to published to deleted", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("link", { name: "New post" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "New post" }),
  ).toBeVisible();

  await field(page, "Title").fill("Written by a test");
  await expect(field(page, "URL")).toHaveValue("written-by-a-test");
  await field(page, "Excerpt").fill("A post the end-to-end tests made.");
  await field(page, "Post").fill("## A section\n\nSome **bold** text.");
  await saveButton(page).click();

  // The first save opens the post's own edit page.
  await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Edit post" }),
  ).toBeVisible();
  await expect(page.getByText("Saved as a draft.")).toBeVisible();

  // Drafts aren't public.
  await page.goto("/blog/written-by-a-test");
  await expect(
    page.getByRole("heading", { level: 1, name: "Signal lost" }),
  ).toBeVisible();

  await page.goBack();
  await choosePublished(page);
  await saveButton(page).click();
  await expect(
    page.getByText("Saved. The live post is updated."),
  ).toBeVisible();
  await expect(field(page, "Publish date")).not.toHaveValue("");

  // The public pages update right away.
  await page.goto("/blog/written-by-a-test");
  await expect(
    page.getByRole("heading", { level: 1, name: "Written by a test" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "A section" }),
  ).toBeVisible();
  await page.goto("/blog");
  await expect(
    page.getByRole("link", { name: "Written by a test" }),
  ).toBeVisible();

  await page.goto("/admin");
  await page
    .getByRole("link", { name: "Written by a test", exact: true })
    .click();
  await deleteFromEditor(page, "Delete post");
  await expect(
    page.getByRole("link", { name: "Written by a test", exact: true }),
  ).toHaveCount(0);
  await page.goto("/blog/written-by-a-test");
  await expect(
    page.getByRole("heading", { level: 1, name: "Signal lost" }),
  ).toBeVisible();
});

test("New post is blank again after creating a post", async ({ page }) => {
  await createDraftPost(page, "The first of two");

  await page.getByRole("link", { name: "Content", exact: true }).click();
  await page.getByRole("link", { name: "New post" }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "New post" }),
  ).toBeVisible();
  await expect(field(page, "Title")).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toHaveCount(0);
});

test("Back and Forward keep unsaved typing", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("link", { name: "New post" }).click();
  await field(page, "Title").fill("Typed, not saved");

  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: "Content" }),
  ).toBeVisible();
  await page.goForward();

  await expect(field(page, "Title")).toHaveValue("Typed, not saved");
  await expect(page.getByText("Unsaved changes")).toBeVisible();
});

test("the preview fits its box without scrolling sideways", async ({
  page,
}) => {
  // The preview shows beside the text from 1024px up.
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/admin/posts/new");
  await field(page, "Post").fill(
    "## A heading\n\nA paragraph that's long enough to reach both edges of the preview.",
  );
  const preview = page
    .locator(".prose-field")
    .filter({ visible: true, hasText: "A paragraph" });
  await expect(preview).toBeVisible();

  const overflow = await preview.evaluate((content) => {
    const box = content.parentElement as HTMLElement;
    return box.scrollWidth - box.clientWidth;
  });
  expect(overflow).toBe(0);
});

test("explains what needs fixing and moves to that field", async ({ page }) => {
  await page.goto("/admin/posts/new");
  await saveButton(page).click();

  await expect(
    page.getByText("Not saved. Fix the highlighted fields."),
  ).toBeVisible();
  const title = field(page, "Title");
  await expect(title).toBeFocused();
  await expect(title).toHaveAccessibleDescription(/This is required/);
  await expect(page).toHaveURL(/\/admin\/posts\/new$/);

  await title.fill("Taking a used address");
  await field(page, "URL").fill("rebuilding-my-portfolio");
  await saveButton(page).click();

  const address = field(page, "URL");
  await expect(address).toBeFocused();
  await expect(address).toHaveAccessibleDescription(
    /Another post already uses this URL/,
  );
});

test("saving a post that was deleted elsewhere says so", async ({
  page,
  browser,
}) => {
  const editor = await createDraftPost(page, "Deleted in another tab");

  const otherTab = await browser.newContext({
    storageState: ADMIN_STORAGE_STATE,
  });
  const other = await otherTab.newPage();
  await other.goto(editor);
  await deleteFromEditor(other, "Delete post");
  await otherTab.close();

  await field(page, "Excerpt").fill("Still writing");
  await saveButton(page).click();
  await expect(
    page.getByText("Not saved. This post has been deleted."),
  ).toBeVisible();
  await expect(field(page, "Excerpt")).toHaveValue("Still writing");
});
