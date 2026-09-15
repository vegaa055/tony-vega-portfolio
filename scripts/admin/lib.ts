import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";
import { createAuth } from "@/lib/auth/create-auth";

/**
 * A database connection and auth instance for command-line scripts. The app's
 * own modules import server-only code that can't run here.
 */
export function connect({ allowSignUp = false } = {}) {
  loadEnvConfig(process.cwd(), true);

  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local.",
    );
  }
  if ((process.env.BETTER_AUTH_SECRET ?? "").length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be set (see .env.example).");
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema, casing: "snake_case" });
  const auth = createAuth({ db, schema, allowSignUp });

  return { db, auth, close: () => pool.end() };
}

/** Asks a question on the terminal and returns the trimmed answer. */
export async function ask(question: string) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Asks for a secret without echoing what's typed. */
export function askHidden(question: string) {
  if (!stdin.isTTY) {
    throw new Error(
      "Run this in an interactive terminal, or pass the value in an environment variable.",
    );
  }

  return new Promise<string>((resolve) => {
    let value = "";
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();

    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
    };

    function onData(chunk: string) {
      // A paste arrives as one chunk, so walk it character by character.
      for (const char of chunk) {
        if (char === "\r" || char === "\n" || char === "") {
          finish();
          resolve(value);
          return;
        }
        if (char === "") {
          finish();
          process.exit(130); // Ctrl+C
        }
        if (char === "" || char === "\b") {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    }

    stdin.on("data", onData);
  });
}

export const MIN_PASSWORD_LENGTH = 12;

/** Prompts for a new password twice and checks it, unless provided by env. */
export async function askNewPassword(envValue: string | undefined) {
  const password =
    envValue ??
    (await askHidden(`Password (${MIN_PASSWORD_LENGTH}+ characters): `));

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Passwords must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }
  if (
    envValue === undefined &&
    (await askHidden("Repeat password: ")) !== password
  ) {
    throw new Error("The passwords didn't match.");
  }
  return password;
}

/** Runs a script, printing errors as plain messages rather than stack traces. */
export function run(main: () => Promise<void>) {
  main().catch((error: unknown) => {
    console.error(
      `\n${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
