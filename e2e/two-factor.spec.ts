import { expect, test, type Page } from "@playwright/test";
import * as OTPAuth from "otpauth";

import { clientIp, E2E_TWO_FACTOR_USER } from "./env";
import { field, signIn, signOut } from "./helpers";

// Uses its own account, so turning on two-factor login doesn't affect the
// admin account the other tests sign in with.
test.use({ extraHTTPHeaders: clientIp(20) });

/** What an authenticator app would show right now for this secret. */
const currentCode = (secret: string) =>
  new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    digits: 6,
    period: 30,
  }).generate();

/** Waits for the next 30-second code if the current one was just used. */
async function freshCode(page: Page, secret: string, used: string[]) {
  if (used.includes(currentCode(secret))) {
    await page.waitForTimeout(30_000 - (Date.now() % 30_000) + 1_000);
  }
  const code = currentCode(secret);
  used.push(code);
  return code;
}

test("two-factor login with an authenticator code and a backup code", async ({
  page,
}) => {
  test.slow(); // May wait for a fresh 30-second code.
  const usedCodes: string[] = [];

  await signIn(page, E2E_TWO_FACTOR_USER);
  await page.getByRole("link", { name: "Security", exact: true }).click();
  await page.getByRole("button", { name: "Set up two-factor login" }).click();
  await field(page, "Password").fill(E2E_TWO_FACTOR_USER.password);
  await page.getByRole("button", { name: "Continue" }).click();

  // The manual setup key, as someone without a camera would type it.
  const secret = await page
    .getByRole("main")
    .locator("code")
    .filter({ hasText: /^[A-Z2-7]{16,}=*$/ })
    .innerText();
  const backupCodes = await page
    .getByRole("region", { name: "Backup codes" })
    .getByRole("listitem")
    .allInnerTexts();
  expect(backupCodes.length).toBeGreaterThan(0);

  await field(page, "Code from your app").fill(
    await freshCode(page, secret, usedCodes),
  );
  await page.getByRole("button", { name: "Turn on" }).click();
  await expect(
    page.getByText(/Two-factor login is on\./).first(),
  ).toBeVisible();

  // Signing in now asks for a code.
  await signOut(page);
  await signIn(page, E2E_TWO_FACTOR_USER);
  await field(page, "Authentication code").fill(
    await freshCode(page, secret, usedCodes),
  );
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Content" }),
  ).toBeVisible();

  // A backup code works once, for when the phone is lost.
  await signOut(page);
  await signIn(page, E2E_TWO_FACTOR_USER);
  await page
    .getByRole("button", { name: "Lost your device? Use a backup code" })
    .click();
  await field(page, "Backup code").fill(backupCodes[0]);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Content" }),
  ).toBeVisible();
});
