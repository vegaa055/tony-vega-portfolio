import { expect, test as setup } from "@playwright/test";

import { ADMIN_STORAGE_STATE, E2E_ADMIN } from "./env";
import { signIn } from "./helpers";

// Signs in once and saves the session, so admin tests start signed in without
// using up login attempts (they're rate limited).
setup("sign in as the admin", async ({ page }) => {
  await signIn(page, E2E_ADMIN);
  await expect(
    page.getByRole("heading", { level: 1, name: "Content" }),
  ).toBeVisible();
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
