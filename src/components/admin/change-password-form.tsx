"use client";

import { useRef, useState } from "react";

import { Field, FormMessage, inputClass } from "@/components/admin/form";
import { buttonClass } from "@/components/button-link";
import { authClient, authErrorMessage } from "@/lib/auth/client";

const MIN_LENGTH = 12;

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("current") ?? "");
    const newPassword = String(form.get("new") ?? "");

    if (newPassword.length < MIN_LENGTH) {
      return setMessage({
        tone: "error",
        text: `Use at least ${MIN_LENGTH} characters for your new password.`,
      });
    }
    if (newPassword !== form.get("repeat")) {
      return setMessage({
        tone: "error",
        text: "The new passwords don't match.",
      });
    }

    setPending(true);
    setMessage(null);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);

    if (error) {
      return setMessage({
        tone: "error",
        text: authErrorMessage(error, {
          INVALID_PASSWORD: "Your current password isn't right.",
        }),
      });
    }
    formRef.current?.reset();
    setMessage({
      tone: "success",
      text: "Password changed. Any other signed-in browsers have been signed out.",
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="max-w-sm space-y-4">
      {message ? (
        <FormMessage tone={message.tone}>{message.text}</FormMessage>
      ) : null}
      <Field id="current-password" label="Current password">
        <input
          id="current-password"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <Field
        id="new-password"
        label="New password"
        hint={`At least ${MIN_LENGTH} characters.`}
      >
        <input
          id="new-password"
          name="new"
          type="password"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          required
          aria-describedby="new-password-hint"
          className={inputClass}
        />
      </Field>
      <Field id="repeat-password" label="Repeat new password">
        <input
          id="repeat-password"
          name="repeat"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary", "sm")}
      >
        {pending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
