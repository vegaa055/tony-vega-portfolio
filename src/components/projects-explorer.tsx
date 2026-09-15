"use client";

import clsx from "clsx";
import { useSyncExternalStore } from "react";

export type ExplorerTag = {
  slug: string;
  name: string;
  count: number;
};

export type ExplorerItem = {
  slug: string;
  tagSlugs: string[];
  /** The card, already rendered on the server. */
  card: React.ReactNode;
};

type ProjectsExplorerProps = {
  tags: ExplorerTag[];
  items: ExplorerItem[];
};

// The selected tag lives in the URL (?tag=audio), so filtered views can be
// shared and survive a reload. The URL is read as an external store rather
// than copied into state.
const TAG_CHANGE = "projects:tag-change";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(TAG_CHANGE, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(TAG_CHANGE, onChange);
  };
}

const readTag = () => new URLSearchParams(window.location.search).get("tag");
// The server always renders every project; the filter applies on the client.
const readServerTag = () => null;

function selectTag(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) {
    url.searchParams.set("tag", slug);
  } else {
    url.searchParams.delete("tag");
  }
  // Next.js syncs native history updates with its router; no page reload.
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(TAG_CHANGE));
}

export function ProjectsExplorer({ tags, items }: ProjectsExplorerProps) {
  const tagInUrl = useSyncExternalStore(subscribe, readTag, readServerTag);
  const activeTag = tags.find((tag) => tag.slug === tagInUrl) ?? null;
  const visible = activeTag
    ? items.filter((item) => item.tagSlugs.includes(activeTag.slug))
    : items;

  return (
    <div>
      {tags.length > 0 ? (
        <div
          role="group"
          aria-label="Filter projects by tag"
          className="flex flex-wrap gap-2"
        >
          <FilterButton
            label="All"
            count={items.length}
            pressed={activeTag === null}
            onClick={() => selectTag(null)}
          />
          {tags.map((tag) => (
            <FilterButton
              key={tag.slug}
              label={tag.name}
              count={tag.count}
              pressed={activeTag?.slug === tag.slug}
              onClick={() => selectTag(tag.slug)}
            />
          ))}
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {activeTag
          ? `Showing ${visible.length} of ${items.length} projects, tagged ${activeTag.name}.`
          : `Showing all ${items.length} projects.`}
      </p>

      <ul className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2">
        {visible.map((item) => (
          <li key={item.slug}>{item.card}</li>
        ))}
      </ul>
    </div>
  );
}

type FilterButtonProps = {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
};

function FilterButton({ label, count, pressed, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        "inline-flex h-9 items-center gap-2 border px-3.5 font-mono text-label tracking-[0.14em] uppercase transition-colors duration-300",
        pressed
          ? "border-flare bg-flare/10 text-star"
          : "border-line-strong text-dust hover:border-dust hover:text-star",
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={pressed ? "text-flare" : "text-faint"}
      >
        {count}
      </span>
      <span className="sr-only">
        , {count} {count === 1 ? "project" : "projects"}
      </span>
    </button>
  );
}
