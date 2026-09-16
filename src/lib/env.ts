import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "must be at least 32 characters (see .env.example)"),
  BLOB_STORE_ID: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
});

function parseServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    // List which variables are wrong, never their values.
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid server environment variables:\n${problems}\nSee .env.example.`,
    );
  }

  return result.data;
}

/** Validated server-only environment variables. */
export const env = parseServerEnv();
