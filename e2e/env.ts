// Settings for the end-to-end tests. The server under test has its own
// database, build folder, and upload folder, so running the tests never
// touches your real content.

export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

/**
 * Recreated from scratch on every run. The setup script refuses to touch a
 * database whose name doesn't end in "_test". CI sets E2E_DATABASE_URL.
 */
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgres://portfolio:portfolio@localhost:5434/portfolio_test";

// Accounts that exist only in the test database. These passwords protect
// nothing real.
export const E2E_ADMIN = {
  name: "Test Admin",
  email: "admin@example.test",
  password: "test-admin-password",
};

export const E2E_TWO_FACTOR_USER = {
  name: "Two-Factor Tester",
  email: "two-factor@example.test",
  password: "test-two-factor-password",
};

/** The admin's saved sign-in, reused by tests that start signed in. */
export const ADMIN_STORAGE_STATE = ".e2e/admin.json";

/** An image from the site, used wherever a test uploads one. */
export const SAMPLE_IMAGE = "public/images/projects/3d-solar-system/cover.webp";

/**
 * Login is rate limited per client IP. Tests that sign in a lot send their own
 * (documentation-range) IP, so they don't use up each other's attempts.
 */
export const clientIp = (lastPart: number) => ({
  "x-forwarded-for": `203.0.113.${lastPart}`,
});

/** Environment for the server under test and its setup script. */
export const e2eServerEnv = {
  DATABASE_URL: E2E_DATABASE_URL,
  // Set too, so nothing falls back to the real database in .env.local.
  DATABASE_URL_UNPOOLED: E2E_DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: E2E_BASE_URL,
  BETTER_AUTH_SECRET: "test-only-secret-for-the-end-to-end-database",
  LOCAL_UPLOADS: "true",
  LOCAL_UPLOAD_DIR: ".e2e/uploads",
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_TELEMETRY_DISABLED: "1",
};
