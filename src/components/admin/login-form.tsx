"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

import {
  describedBy,
  Field,
  FormMessage,
  inputClass,
} from "@/components/admin/form";
import { buttonClass } from "@/components/button-link";
import { authClient, authErrorMessage } from "@/lib/auth/client";

type Step = "password" | "totp" | "backup-code";

const LOGIN_ERRORS = {
  ACCOUNT_TEMPORARILY_LOCKED:
    "Too many wrong codes. Sign-in is locked for a few minutes.",
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  INVALID_CODE:
    "That code isn't right. Check your authenticator app and try again.",
  INVALID_BACKUP_CODE:
    "That backup code isn't valid, or it has already been used.",
};

/**
 * A ref that clears a form's fields when it's hidden or removed. After signing
 * in, Next.js keeps this page mounted (hidden), typed password included.
 */
const clearOnHide = (form: HTMLFormElement | null) => () => form?.reset();

/**
 * Password first, then (when two-factor is on) a code from an authenticator
 * app or a backup code. Calls go through /api/auth so they're rate limited.
 */
export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Start over at the password step if the page is shown again.
  useLayoutEffect(
    () => () => {
      setStep("password");
      setError(null);
    },
    [],
  );

  function signedIn() {
    router.replace("/admin");
    router.refresh();
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { data, error } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      rememberMe: true,
    });

    setPending(false);
    if (error) return setError(authErrorMessage(error, LOGIN_ERRORS));
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      return setStep("totp");
    }
    signedIn();
  }

  async function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "").replace(/\s+/g, "");
    const trustDevice = form.get("trust-device") === "on";
    setPending(true);
    setError(null);

    const { error } =
      step === "totp"
        ? await authClient.twoFactor.verifyTotp({ code, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({ code, trustDevice });

    setPending(false);
    if (error) return setError(authErrorMessage(error, LOGIN_ERRORS));
    signedIn();
  }

  if (step === "password") {
    return (
      <form ref={clearOnHide} onSubmit={submitPassword} className="space-y-5">
        {error ? <FormMessage tone="error">{error}</FormMessage> : null}
        <Field id="email" label="Email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={inputClass}
          />
        </Field>
        <Field id="password" label="Password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </Field>
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("primary") + " w-full"}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    );
  }

  const usingBackupCode = step === "backup-code";
  const hint = usingBackupCode
    ? "Each backup code works once."
    : "The 6-digit code from your authenticator app.";

  return (
    <form ref={clearOnHide} onSubmit={submitCode} className="space-y-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Field
        id="code"
        label={usingBackupCode ? "Backup code" : "Authentication code"}
        hint={hint}
      >
        <input
          key={step}
          id="code"
          name="code"
          type="text"
          autoFocus
          required
          autoComplete="one-time-code"
          inputMode={usingBackupCode ? "text" : "numeric"}
          pattern={usingBackupCode ? undefined : "[0-9 ]{6,7}"}
          aria-describedby={describedBy("code", hint)}
          className={inputClass + " font-mono tracking-[0.3em]"}
        />
      </Field>

      <label className="flex items-center gap-2.5 text-sm text-dust">
        <input
          type="checkbox"
          name="trust-device"
          className="size-4 accent-flare"
        />
        Trust this browser for 30 days
      </label>

      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary") + " w-full"}
      >
        {pending ? "Checking…" : "Verify"}
      </button>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setStep(usingBackupCode ? "totp" : "backup-code");
        }}
        className="w-full text-center text-sm text-dust underline decoration-line-strong underline-offset-4 hover:text-star"
      >
        {usingBackupCode
          ? "Use your authenticator app instead"
          : "Lost your device? Use a backup code"}
      </button>
    </form>
  );
}
