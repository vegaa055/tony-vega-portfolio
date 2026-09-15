/**
 * Creates the admin account. The site has exactly one, and no sign-up page.
 *
 *   npm run admin:create
 *
 * Prompts for a name, email, and password (typing is hidden). For a
 * non-interactive setup, set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD.
 */
import { z } from "zod";

import { users } from "@/db/schema";

import { ask, askNewPassword, connect, run } from "./lib";

run(async () => {
  // Sign-up is allowed only for this script's own auth instance.
  const { db, auth, close } = connect({ allowSignUp: true });

  try {
    const [existing] = await db
      .select({ email: users.email })
      .from(users)
      .limit(1);
    if (existing) {
      throw new Error(
        `An admin account already exists (${existing.email}).\n` +
          "To change its password or turn off two-factor login, run: npm run admin:reset",
      );
    }

    const name = process.env.ADMIN_NAME ?? (await ask("Name: "));
    const email = process.env.ADMIN_EMAIL ?? (await ask("Email: "));
    if (!name) throw new Error("A name is required.");
    if (!z.email().safeParse(email).success) {
      throw new Error("That doesn't look like an email address.");
    }
    const password = await askNewPassword(process.env.ADMIN_PASSWORD);

    await auth.api.signUpEmail({ body: { name, email, password } });

    console.log(
      `\nAdmin account created for ${email}.\n` +
        "Sign in at /admin/login, then turn on two-factor login under Security.",
    );
  } finally {
    await close();
  }
});
