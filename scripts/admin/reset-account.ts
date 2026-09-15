/**
 * Recovery for the admin account.
 *
 *   npm run admin:reset                          set a new password
 *   npm run admin:reset -- --disable-2fa         turn off two-factor login
 *   npm run admin:reset -- --password --disable-2fa   both
 *
 * Use --disable-2fa if you've lost both your authenticator app and your
 * backup codes. Either way, every existing session is signed out.
 * Non-interactive: set ADMIN_PASSWORD instead of typing it.
 */
import { eq } from "drizzle-orm";

import { sessions, twoFactors, users } from "@/db/schema";

import { askNewPassword, connect, run } from "./lib";

run(async () => {
  const args = new Set(process.argv.slice(2));
  const disableTwoFactor = args.has("--disable-2fa");
  // A new password is the default when no option is given.
  const setPassword = args.has("--password") || !disableTwoFactor;

  const { db, auth, close } = connect();

  try {
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .limit(1);
    if (!user) {
      throw new Error(
        "There's no admin account yet. Run: npm run admin:create",
      );
    }
    console.log(`Admin account: ${user.email}`);

    if (setPassword) {
      const password = await askNewPassword(process.env.ADMIN_PASSWORD);
      const context = await auth.$context;
      await context.internalAdapter.updatePassword(
        user.id,
        await context.password.hash(password),
      );
      console.log("Password updated.");
    }

    if (disableTwoFactor) {
      await db.delete(twoFactors).where(eq(twoFactors.userId, user.id));
      await db
        .update(users)
        .set({ twoFactorEnabled: false })
        .where(eq(users.id, user.id));
      console.log(
        "Two-factor login turned off. Set it up again under Security.",
      );
    }

    await db.delete(sessions).where(eq(sessions.userId, user.id));
    console.log("Signed out everywhere.");
  } finally {
    await close();
  }
});
