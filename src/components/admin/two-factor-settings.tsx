"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { renderSVG } from "uqr";

import {
  describedBy,
  Field,
  FormMessage,
  inputClass,
} from "@/components/admin/form";
import { buttonClass } from "@/components/button-link";
import { authClient, authErrorMessage } from "@/lib/auth/client";

type Purpose = "enable" | "disable" | "new-backup-codes";

type Stage =
  | { step: "idle" }
  | { step: "password"; purpose: Purpose }
  | { step: "scan"; totpURI: string; backupCodes: string[] }
  | { step: "backup-codes"; backupCodes: string[] };

type AuthError = Parameters<typeof authErrorMessage>[0];

const describe = (error: AuthError) =>
  authErrorMessage(error, {
    INVALID_PASSWORD: "That password isn't right.",
    INVALID_CODE:
      "That code isn't right. Codes change every 30 seconds; try the current one.",
  });

const PASSWORD_PROMPTS: Record<Purpose, { title: string; action: string }> = {
  enable: {
    title: "Confirm your password to set up two-factor login.",
    action: "Continue",
  },
  disable: {
    title: "Confirm your password to turn off two-factor login.",
    action: "Turn off",
  },
  "new-backup-codes": {
    title: "Confirm your password to replace your backup codes.",
    action: "Make new codes",
  },
};

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function begin(purpose: Purpose) {
    setError(null);
    setNotice(null);
    setStage({ step: "password", purpose });
  }

  async function confirmPassword(
    event: React.FormEvent<HTMLFormElement>,
    purpose: Purpose,
  ) {
    event.preventDefault();
    const password = String(
      new FormData(event.currentTarget).get("password") ?? "",
    );
    setPending(true);
    setError(null);

    if (purpose === "enable") {
      const { data, error } = await authClient.twoFactor.enable({
        password,
        method: "totp",
      });
      setPending(false);
      if (error || data?.method !== "totp") return setError(describe(error));
      setStage({
        step: "scan",
        totpURI: data.totpURI,
        backupCodes: data.backupCodes,
      });
    } else if (purpose === "disable") {
      const { error } = await authClient.twoFactor.disable({ password });
      setPending(false);
      if (error) return setError(describe(error));
      setStage({ step: "idle" });
      setNotice("Two-factor login is off.");
      router.refresh();
    } else {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({
        password,
      });
      setPending(false);
      if (error || !data) return setError(describe(error));
      setStage({ step: "backup-codes", backupCodes: data.backupCodes });
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(
      new FormData(event.currentTarget).get("code") ?? "",
    ).replace(/\s+/g, "");
    setPending(true);
    setError(null);
    const { error } = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (error) return setError(describe(error));
    setStage({ step: "idle" });
    setNotice(
      "Two-factor login is on. You'll be asked for a code each time you sign in.",
    );
    router.refresh();
  }

  const cancel = (
    <button
      type="button"
      onClick={() => {
        setError(null);
        setStage({ step: "idle" });
      }}
      className={buttonClass("quiet", "sm")}
    >
      Cancel
    </button>
  );

  return (
    <div className="space-y-6">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      {notice ? <FormMessage tone="success">{notice}</FormMessage> : null}

      {stage.step === "idle" ? (
        <div className="space-y-5">
          <p className="flex items-center gap-2.5 text-star">
            <span
              aria-hidden="true"
              className={
                enabled
                  ? "size-2 rounded-full bg-flare shadow-[0_0_8px_1px_rgb(255_106_77/0.5)]"
                  : "size-2 rounded-full border border-faint"
              }
            />
            Two-factor login is {enabled ? "on" : "off"}.
          </p>
          <p className="max-w-reading text-sm leading-relaxed text-dust">
            {enabled
              ? "Signing in needs your password and a code from your authenticator app. If you lose the app, sign in with a backup code."
              : "Add a second step to signing in: a 6-digit code from an authenticator app on your phone. Even if someone learns your password, they can't sign in without it."}
          </p>
          <div className="flex flex-wrap gap-3">
            {enabled ? (
              <>
                <button
                  type="button"
                  onClick={() => begin("new-backup-codes")}
                  className={buttonClass("ghost", "sm")}
                >
                  New backup codes
                </button>
                <button
                  type="button"
                  onClick={() => begin("disable")}
                  className={buttonClass("danger", "sm")}
                >
                  Turn off
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => begin("enable")}
                className={buttonClass("primary", "sm")}
              >
                Set up two-factor login
              </button>
            )}
          </div>
        </div>
      ) : null}

      {stage.step === "password" ? (
        <form
          onSubmit={(event) => confirmPassword(event, stage.purpose)}
          className="max-w-sm space-y-4"
        >
          <p className="text-sm text-dust">
            {PASSWORD_PROMPTS[stage.purpose].title}
          </p>
          <Field id="confirm-password" label="Password">
            <input
              id="confirm-password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className={buttonClass(
                stage.purpose === "disable" ? "danger" : "primary",
                "sm",
              )}
            >
              {pending ? "Checking…" : PASSWORD_PROMPTS[stage.purpose].action}
            </button>
            {cancel}
          </div>
        </form>
      ) : null}

      {stage.step === "scan" ? (
        <div className="space-y-8">
          <div className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
            <div
              role="img"
              aria-label="QR code to add this site to your authenticator app"
              className="bg-white w-fit rounded-xs p-2 [&>svg]:size-48"
              // Generated locally from the setup link; the secret never leaves the browser.
              dangerouslySetInnerHTML={{
                __html: renderSVG(stage.totpURI, { border: 2, ecc: "M" }),
              }}
            />
            <div className="space-y-5">
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-dust marker:text-faint">
                <li>
                  Open an authenticator app, such as 1Password, Google
                  Authenticator, or Authy.
                </li>
                <li>
                  Scan the code. If you can&apos;t scan, enter this key instead:{" "}
                  <code className="rounded-xs bg-nebula px-1.5 py-0.5 font-mono text-xs break-all text-star">
                    {new URL(stage.totpURI).searchParams.get("secret")}
                  </code>
                </li>
                <li>Save the backup codes below somewhere safe.</li>
                <li>Enter the 6-digit code your app shows to finish.</li>
              </ol>
              <form onSubmit={verifyCode} className="max-w-xs space-y-4">
                <Field
                  id="setup-code"
                  label="Code from your app"
                  hint="Codes change every 30 seconds."
                >
                  <input
                    id="setup-code"
                    name="code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9 ]{6,7}"
                    required
                    aria-describedby={describedBy("setup-code", true)}
                    className={inputClass + " font-mono tracking-[0.3em]"}
                  />
                </Field>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className={buttonClass("primary", "sm")}
                  >
                    {pending ? "Checking…" : "Turn on"}
                  </button>
                  {cancel}
                </div>
              </form>
            </div>
          </div>
          <BackupCodes codes={stage.backupCodes} />
        </div>
      ) : null}

      {stage.step === "backup-codes" ? (
        <div className="space-y-5">
          <BackupCodes codes={stage.backupCodes} />
          <button
            type="button"
            onClick={() => {
              setStage({ step: "idle" });
              setNotice("Your old backup codes no longer work.");
            }}
            className={buttonClass("primary", "sm")}
          >
            I&apos;ve saved them
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BackupCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");

  function download() {
    const url = URL.createObjectURL(
      new Blob([`${text}\n`], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "tony-vega-admin-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      aria-labelledby="backup-codes-heading"
      className="rounded-xs border border-line p-5"
    >
      <h3
        id="backup-codes-heading"
        className="font-mono text-[0.66rem] tracking-[0.16em] text-star uppercase"
      >
        Backup codes
      </h3>
      <p className="mt-2 max-w-reading text-sm leading-relaxed text-dust">
        Each code signs you in once if you lose your authenticator app. Store
        them in a password manager. They won&apos;t be shown again.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm text-star sm:grid-cols-5">
        {codes.map((code) => (
          <li
            key={code}
            className="rounded-xs bg-nebula px-2 py-1.5 text-center tracking-wider"
          >
            {code}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          }}
          className={buttonClass("ghost", "sm")}
        >
          {copied ? "Copied" : "Copy codes"}
        </button>
        <button
          type="button"
          onClick={download}
          className={buttonClass("ghost", "sm")}
        >
          Download
        </button>
      </div>
    </section>
  );
}
