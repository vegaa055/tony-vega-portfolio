"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import type { ActionFailure } from "@/app/admin/actions";
import { runAction } from "@/components/admin/run-action";
import { mergeSavedChanges } from "@/components/admin/saved-values";
import {
  carriedSavedMessage,
  carrySavedMessage,
  clearCarriedSavedMessage,
} from "@/components/admin/saved-message";
import type { FieldErrors } from "@/lib/validation";

type SavedUpdate<T> = {
  /** Fields the server filled in, like a publish date. */
  changes?: Partial<T>;
  /** Shown in the save bar until the next change. */
  message: string;
  /** A page to open next, like a new item's edit page after its first save. */
  redirectTo?: Route;
};

const failed = (result: { ok: boolean }): result is ActionFailure => !result.ok;

/**
 * Form state for an admin editor: the current values, whether they differ
 * from what was last saved, saving through a Server Action, unique field ids,
 * and a warning before leaving with unsaved changes.
 */
export function useEditor<T extends object>(initial: T) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const idPrefix = useId();
  const [values, setValues] = useState(initial);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  // Starts with the confirmation from the save that opened this page, if any.
  const [savedMessage, setSavedMessage] = useState(() =>
    carriedSavedMessage(pathname),
  );
  const [saving, startSaving] = useTransition();
  const dirty = JSON.stringify(values) !== savedJson;

  useUnsavedChangesWarning(dirty);

  useEffect(() => {
    clearCarriedSavedMessage(pathname);
  }, [pathname]);

  // After a rejected save, move to the first field with an error.
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const field = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    field?.focus({ preventScroll: true });
    // Centered, so the sticky save bar can't cover it.
    field?.scrollIntoView({ block: "center" });
  }, [errors]);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  }, []);

  /**
   * A unique element id for a field. Next.js keeps recently visited pages
   * mounted, so two editors can be in the document at once.
   */
  const fieldId = (name: string) => `${idPrefix}${name}`;

  /**
   * Sends the current values to `action`. On success, `onSaved` returns what
   * to update. Anything typed while the save was running is kept, and still
   * counts as unsaved.
   */
  function save<Success extends { ok: true }>(
    action: (sent: T) => Promise<Success | ActionFailure>,
    onSaved: (result: Success, sent: T) => SavedUpdate<T>,
  ) {
    const sent = values;
    startSaving(async () => {
      const result = await runAction(() => action(sent));

      // Updates after an await need their own startTransition to stay part of
      // the save, so `saving` is true until they (or a redirect) finish.
      startSaving(() => {
        if (failed(result)) {
          setFailure(result);
          // Keep earlier field errors when the server never got to check.
          if (result.fieldErrors) setErrors(result.fieldErrors);
          return;
        }

        const { changes = {}, message, redirectTo } = onSaved(result, sent);
        setSavedJson(JSON.stringify({ ...sent, ...changes }));
        setValues((current) => mergeSavedChanges(current, sent, changes));
        setFailure(null);
        setErrors({});

        if (redirectTo) {
          // The next page shows the confirmation once it opens.
          carrySavedMessage(redirectTo, message);
          router.replace(redirectTo);
        } else {
          setSavedMessage(message);
        }
      });
    });
  }

  return {
    formRef,
    values,
    set,
    setValues,
    dirty,
    errors,
    failure,
    saving,
    savedMessage,
    fieldId,
    save,
  };
}

const LEAVE_MESSAGE = "You have unsaved changes. Leave without saving?";

function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    // Closing the tab, reloading, or typing a new address.
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    // Clicking a link inside the app. Runs in the capture phase, before
    // Next.js's <Link> handles the click.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}
