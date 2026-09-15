"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { previewMarkdownAction } from "@/app/admin/actions";
import { describedBy, inputClass, labelClass } from "@/components/admin/form";
import { runAction } from "@/components/admin/run-action";
import { altFromFileName, uploadImage } from "@/lib/uploads/client";
import { IMAGE_ACCEPT, type UploadMode } from "@/lib/uploads/shared";

type MarkdownEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadMode: UploadMode;
  hint?: string;
  error?: string;
};

// Side-by-side preview from the lg breakpoint; tabs below it.
const WIDE = "(min-width: 64rem)";
const subscribeToWidth = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isWide = () => window.matchMedia(WIDE).matches;

/**
 * A plain textarea with formatting buttons, keyboard shortcuts, image
 * paste/drop, and a live preview rendered by the site's own Markdown pipeline.
 */
export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  uploadMode,
  hint,
  error,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const latestPreview = useRef(0);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState<{
    source: string;
    content: React.ReactNode;
  } | null>(null);
  // Why the preview is out of date, if something went wrong.
  const [previewProblem, setPreviewProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const wide = useSyncExternalStore(subscribeToWidth, isWide, () => false);
  const previewShown = wide || tab === "preview";

  // Re-render the preview shortly after typing stops. Only the newest
  // response is kept, in case an older one arrives late.
  useEffect(() => {
    if (!previewShown || preview?.source === value) return;
    const request = ++latestPreview.current;
    const timer = window.setTimeout(
      async () => {
        const result = await runAction(() => previewMarkdownAction(value));
        if (request !== latestPreview.current) return;
        if (result.ok) {
          setPreview({ source: value, content: result.content });
          setPreviewProblem(null);
        } else {
          setPreviewProblem(
            result.signedOut ? "Signed out" : "Preview unavailable",
          );
        }
      },
      preview ? 500 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [value, previewShown, preview]);

  /** Replaces a range and selects part of the inserted text. */
  function replaceRange(
    from: number,
    to: number,
    text: string,
    select: [number, number] = [text.length, text.length],
  ) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(from, to);
    // insertText keeps the browser's undo history working. It's deprecated
    // but still supported everywhere; fall back if it ever isn't.
    if (!document.execCommand("insertText", false, text)) {
      textarea.setRangeText(text, from, to, "end");
      onChange(textarea.value);
    }
    textarea.setSelectionRange(from + select[0], from + select[1]);
  }

  function selection() {
    const textarea = textareaRef.current;
    if (!textarea) return null;
    const { selectionStart: start, selectionEnd: end, value: all } = textarea;
    return { start, end, all, selected: all.slice(start, end) };
  }

  function wrap(marker: string, placeholder: string) {
    const current = selection();
    if (!current) return;
    const inner = current.selected || placeholder;
    replaceRange(current.start, current.end, `${marker}${inner}${marker}`, [
      marker.length,
      marker.length + inner.length,
    ]);
  }

  function prefixLines(prefix: string) {
    const current = selection();
    if (!current) return;
    const { all } = current;
    const start = all.lastIndexOf("\n", current.start - 1) + 1;
    const lineEnd = all.indexOf("\n", current.end);
    const end = lineEnd === -1 ? all.length : lineEnd;
    const text = all
      .slice(start, end)
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    replaceRange(start, end, text);
  }

  function insertLink() {
    const current = selection();
    if (!current) return;
    const label = current.selected || "link text";
    const urlStart = label.length + 3;
    replaceRange(current.start, current.end, `[${label}](https://)`, [
      urlStart,
      urlStart + "https://".length,
    ]);
  }

  function insertCode() {
    const current = selection();
    if (!current) return;
    if (!current.selected.includes("\n")) return wrap("`", "code");
    replaceRange(
      current.start,
      current.end,
      `\`\`\`\n${current.selected}\n\`\`\``,
      [4, 4 + current.selected.length],
    );
  }

  /**
   * Inserts images at the cursor, each on its own lines so they never join a
   * sentence or a code fence, and selects the first description to type over.
   */
  function insertImages(snippets: string[]) {
    const current = selection();
    if (!current) return;
    const before = current.all.slice(0, current.start);
    const after = current.all.slice(current.end);
    const lead =
      before === "" || before.endsWith("\n\n")
        ? ""
        : before.endsWith("\n")
          ? "\n"
          : "\n\n";
    const trail =
      after === "" || after.startsWith("\n\n")
        ? ""
        : after.startsWith("\n")
          ? "\n"
          : "\n\n";
    // The first description sits between "![" and "](".
    const altStart = lead.length + 2;
    const altEnd = lead.length + snippets[0].indexOf("](");
    replaceRange(
      current.start,
      current.end,
      lead + snippets.join("\n\n") + trail,
      [altStart, altEnd],
    );
  }

  async function uploadAndInsert(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;

    setUploading(true);
    setNotice(
      images.length === 1
        ? "Uploading image…"
        : `Uploading ${images.length} images…`,
    );
    const snippets: string[] = [];
    let problem: string | null = null;
    try {
      for (const file of images) {
        const { url } = await uploadImage(file, uploadMode);
        snippets.push(`![${altFromFileName(file.name)}](${url})`);
      }
    } catch (uploadError) {
      problem =
        uploadError instanceof Error
          ? uploadError.message
          : "The upload failed.";
    } finally {
      setUploading(false);
    }

    // Insert wherever the cursor is now, not where it was when uploading
    // began, and keep whatever finished uploading even if a later file failed.
    if (snippets.length > 0) insertImages(snippets);
    setNotice(
      problem ??
        "Uploaded. Replace the text in [square brackets] with a description of each image.",
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      wrap("**", "bold text");
    } else if (key === "i") {
      event.preventDefault();
      wrap("_", "italic text");
    } else if (key === "k") {
      event.preventDefault();
      insertLink();
    }
  }

  const hasFiles = (types: readonly string[]) => types.includes("Files");
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <div
          role="group"
          aria-label="Editor view"
          className="flex gap-1 lg:hidden"
        >
          {(["write", "preview"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={tab === option}
              onClick={() => setTab(option)}
              className={clsx(
                "rounded-xs px-3 py-1 font-mono text-micro tracking-[0.14em] uppercase",
                tab === option
                  ? "bg-nebula text-star"
                  : "text-dust hover:text-star",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 grid gap-4 lg:grid-cols-2">
        <div
          className={clsx("min-w-0", tab === "preview" && "hidden lg:block")}
        >
          <div
            role="group"
            aria-label="Formatting"
            className="flex flex-wrap items-center gap-0.5 rounded-t-xs border border-b-0 border-field bg-nebula/60 px-1.5 py-1"
          >
            <ToolButton
              label="Bold"
              shortcut="Ctrl+B"
              onClick={() => wrap("**", "bold text")}
            >
              <span className="font-bold">B</span>
            </ToolButton>
            <ToolButton
              label="Italic"
              shortcut="Ctrl+I"
              onClick={() => wrap("_", "italic text")}
            >
              <span className="italic">I</span>
            </ToolButton>
            <ToolButton label="Heading" onClick={() => prefixLines("## ")}>
              H
            </ToolButton>
            <ToolButton label="Link" shortcut="Ctrl+K" onClick={insertLink}>
              ⧉
            </ToolButton>
            <ToolButton label="Quote" onClick={() => prefixLines("> ")}>
              ❝
            </ToolButton>
            <ToolButton label="Bulleted list" onClick={() => prefixLines("- ")}>
              ≡
            </ToolButton>
            <ToolButton label="Code" onClick={insertCode}>
              {"</>"}
            </ToolButton>
            <ToolButton
              label="Insert image"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              ▣
            </ToolButton>
          </div>
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={(event) => {
              const files = [...event.clipboardData.files];
              if (files.some((file) => file.type.startsWith("image/"))) {
                event.preventDefault();
                void uploadAndInsert(files);
              }
            }}
            onDragOver={(event) => {
              if (hasFiles(event.dataTransfer.types)) event.preventDefault();
            }}
            onDrop={(event) => {
              if (!hasFiles(event.dataTransfer.types)) return;
              event.preventDefault();
              void uploadAndInsert([...event.dataTransfer.files]);
            }}
            rows={22}
            spellCheck
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy(id, hint, error)}
            className={clsx(
              inputClass,
              "min-h-[26rem] resize-y rounded-t-none font-mono text-[0.8rem] leading-relaxed font-stretch-semi-condensed",
            )}
          />
        </div>

        <div
          className={clsx(
            "flex min-w-0 flex-col",
            tab === "write" && "hidden lg:flex",
          )}
        >
          <div className="flex h-9 shrink-0 items-center justify-between rounded-t-xs border border-b-0 border-line-strong bg-nebula/60 px-3 font-mono text-micro tracking-[0.14em] text-faint uppercase">
            <span>Preview</span>
            {previewProblem ? (
              <span className="text-flare-soft">{previewProblem}</span>
            ) : preview?.source !== value && value.trim() ? (
              <span>Updating…</span>
            ) : null}
          </div>
          <div className="min-h-[26rem] flex-1 overflow-auto rounded-b-xs border border-line-strong bg-void px-5 py-6">
            {value.trim() ? (
              // The box has its own background, and the site's reading
              // backdrop would stick out of it and make it scroll sideways.
              <div className="prose-field before:hidden">
                {preview?.content}
              </div>
            ) : (
              <p className="text-sm text-faint">Nothing to preview yet.</p>
            )}
          </div>
        </div>
      </div>

      {hint ? (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-xs leading-relaxed text-faint"
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-flare-soft">
          {error}
        </p>
      ) : null}
      <p role="status" className="mt-1.5 text-xs text-dust empty:hidden">
        {notice}
      </p>

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          void uploadAndInsert([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

type ToolButtonProps = {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolButton({
  label,
  shortcut,
  onClick,
  disabled,
  children,
}: ToolButtonProps) {
  const name = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={name}
      title={name}
      className="inline-flex h-7 min-w-7 items-center justify-center rounded-xs px-1.5 font-mono text-xs text-dust transition-colors hover:bg-line hover:text-star disabled:opacity-40"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
