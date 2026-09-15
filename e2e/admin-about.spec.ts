import { expect, test } from "@playwright/test";

import { ADMIN_STORAGE_STATE } from "./env";
import { field, saveButton } from "./helpers";

test.use({ storageState: ADMIN_STORAGE_STATE });

test("About page edits show on the site right away", async ({ page }) => {
  await page.goto("/admin/about");
  const headline = field(page, "Headline");
  const original = await headline.inputValue();

  await headline.fill("A headline changed by the tests");
  await saveButton(page).click();
  await expect(
    page.getByText("Saved. The About page is updated."),
  ).toBeVisible();

  await page.goto("/about");
  await expect(page.getByText("A headline changed by the tests")).toBeVisible();

  await page.goto("/admin/about");
  await field(page, "Headline").fill(original);
  await saveButton(page).click();
  await expect(
    page.getByText("Saved. The About page is updated."),
  ).toBeVisible();
});

test("a skill group needs a name", async ({ page }) => {
  await page.goto("/admin/about");
  const groups = page
    .getByRole("group", { name: "Skills", exact: true })
    .getByRole("listitem");
  const count = await groups.count();

  await page.getByRole("button", { name: "Add a skill group" }).click();
  await saveButton(page).click();

  const name = field(page, `Group ${count + 1} name`);
  await expect(name).toBeFocused();
  await expect(name).toHaveAccessibleDescription("This is required.");
});
