"use client";

import { unstable_rethrow } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { buttonClass } from "@/components/button-link";

type ConfirmDialogProps = {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  onConfirm: () => Promise<unknown> | void;
};

/** A button that asks for confirmation in a modal before a destructive action. */
export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  pendingLabel = "Working…",
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      setError(null);
      try {
        await onConfirm();
      } catch (caught) {
        // A redirect after success still goes through.
        unstable_rethrow(caught);
        setError("That didn't work. Check your connection, then try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonClass("danger", "sm")}
      >
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => setError(null)}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xs border border-line-strong bg-deep p-6 text-star backdrop:bg-void/80 backdrop:backdrop-blur-sm"
      >
        <h2 id={titleId} className="text-lg font-medium">
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-2 text-sm leading-relaxed text-dust"
        >
          {description}
        </p>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-flare-soft">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          {/* Focus starts on the safe choice. */}
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className={buttonClass("ghost", "sm")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={confirm}
            className={buttonClass("danger", "sm")}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
