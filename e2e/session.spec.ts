import { expect, test } from "@playwright/test";

import { ADMIN_STORAGE_STATE, clientIp, E2E_ADMIN } from "./env";
import { field, saveButton, signIn, signOut } from "./helpers";

test("admin pages send visitors to the login page", async ({ page }) => {
  for (const path of ["/admin", "/admin/posts/new", "/admin/security"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/admin\/login$/);
  }
});

test.describe("login attempts", () => {
  test.use({ extraHTTPHeaders: clientIp(10) });

  test("are refused with a wrong password, and limited to five a minute", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    // The form's message. (Next.js has its own alert region for page changes.)
    const message = page.getByRole("main").getByRole("alert");

    const attempt = async (password: string) => {
      await field(page, "Email").fill(E2E_ADMIN.email);
      await field(page, "Password").fill(password);
      const response = page.waitForResponse("**/api/auth/sign-in/email");
      await page.getByRole("button", { name: "Sign in" }).click();
      await response;
    };

    for (let count = 1; count <= 5; count++) {
      await attempt(`wrong-password-${count}`);
      await expect(message).toHaveText("That email and password don't match.");
    }

    // Even the right password is refused once the limit is reached.
    await attempt(E2E_ADMIN.password);
    await expect(message).toHaveText(
      "Too many attempts. Wait a minute, then try again.",
    );
  });
});

test.describe("signing out", () => {
  test.use({ extraHTTPHeaders: clientIp(11) });

  test("leaves nothing to come Back to", async ({ page }) => {
    await signIn(page, E2E_ADMIN);
    await page.getByRole("link", { name: "About page" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "About page" }),
    ).toBeVisible();

    await signOut(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(field(page, "Headline")).toHaveCount(0);
  });
});

test.describe("when the session ends while editing", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("saving explains what happened and keeps the work", async ({
    page,
    context,
  }) => {
    await page.goto("/admin/posts/new");
    await field(page, "Title").fill("Written after signing out");
    await context.clearCookies();

    await saveButton(page).click();
    await expect(
      page.getByText("Not saved. You've been signed out."),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Sign in again/ }),
    ).toHaveAttribute("target", "_blank");
    await expect(page).toHaveURL(/\/admin\/posts\/new$/);
    await expect(field(page, "Title")).toHaveValue("Written after signing out");
  });
});
