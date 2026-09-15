import { expect, type Page } from "@playwright/test";

/**
 * A form field by its exact label. Only visible inputs, textareas, and selects
 * count: Next.js keeps recently visited pages in the document (hidden), and
 * sections can share a field's label (a "Password" section, say).
 */
export const field = (page: Page, label: string) =>
  page
    .locator("input, textarea, select")
    .and(page.getByLabel(label, { exact: true }))
    .filter({ visible: true });

/** Fills in the login form and submits it. */
export async function signIn(
  page: Page,
  account: { email: string; password: string },
) {
  await page.goto("/admin/login");
  await field(page, "Email").fill(account.email);
  await field(page, "Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/**
 * Signs out and waits for the login page. Moving on sooner would cancel the
 * sign-out request, leaving the session in place.
 */
export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
}

/** The editor's Save button, in the bar at the bottom of the form. */
export const saveButton = (page: Page) =>
  page.getByRole("button", { name: "Save", exact: true });

/** Chooses "Published" in an editor's status options. */
export async function choosePublished(page: Page) {
  await page
    .locator("label")
    .filter({ hasText: "Live on the site", visible: true })
    .click();
}

/** Deletes the post or project open in the editor, and waits for the dashboard. */
export async function deleteFromEditor(
  page: Page,
  confirmLabel: "Delete post" | "Delete project",
) {
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: confirmLabel })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Creates a draft post with just a title, and returns its editor's address. */
export async function createDraftPost(page: Page, title: string) {
  await page.goto("/admin/posts/new");
  await field(page, "Title").fill(title);
  await saveButton(page).click();
  await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Saved as a draft.")).toBeVisible();
  return page.url();
}
