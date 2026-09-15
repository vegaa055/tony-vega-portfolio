"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  ContentMissingError,
  deletePost,
  deleteProject,
  moveProject,
  saveAbout,
  savePost,
  saveProject,
  SlugTakenError,
} from "@/data/admin";
import { getAdmin, requireAdmin } from "@/lib/auth/session";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { renderMarkdown } from "@/lib/markdown/render";
import {
  aboutInputSchema,
  fieldErrorsOf,
  postInputSchema,
  projectInputSchema,
  type AboutInput,
  type FieldErrors,
  type PostInput,
  type ProjectInput,
} from "@/lib/validation";

// Every action checks the session first. Server Actions are public HTTP
// endpoints, so they must never trust that the caller came from an admin page.
//
// Actions called from an editor (save, preview) return a "signed out" result
// instead of redirecting to the login page: a redirect would navigate away
// and lose the admin's unsaved changes. The rest use requireAdmin().

/** Why an editor action didn't work, shown in the editor's save bar. */
export type ActionFailure = {
  ok: false;
  message: string;
  fieldErrors?: FieldErrors;
  /** The session ended. The editor offers a link to sign in again. */
  signedOut?: true;
};

export type SaveResult =
  | {
      ok: true;
      id: string;
      slug: string;
      /** As stored, so the editor shows the date publishing filled in. */
      publishedAt: string;
    }
  | ActionFailure;

export type AboutSaveResult = { ok: true } | ActionFailure;

export type PreviewResult =
  { ok: true; content: React.ReactNode } | ActionFailure;

const SIGNED_OUT: ActionFailure = {
  ok: false,
  signedOut: true,
  message: "Not saved. You've been signed out.",
};

const invalid = (fieldErrors: FieldErrors): ActionFailure => ({
  ok: false,
  message: "Not saved. Fix the highlighted fields.",
  fieldErrors,
});

const missing = (kind: "post" | "project"): ActionFailure => ({
  ok: false,
  message: `Not saved. This ${kind} has been deleted.`,
});

/** Renders Markdown exactly as the public site will, for the live preview. */
export async function previewMarkdownAction(
  source: string,
): Promise<PreviewResult> {
  if (!(await getAdmin())) return SIGNED_OUT;
  const { content } = await renderMarkdown(source.slice(0, 200_000));
  return { ok: true, content };
}

/* Projects ----------------------------------------------------------------- */

export async function saveProjectAction(
  id: string | null,
  input: ProjectInput,
): Promise<SaveResult> {
  if (!(await getAdmin())) return SIGNED_OUT;

  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return invalid(fieldErrorsOf(parsed.error));

  try {
    const saved = await saveProject(id, parsed.data);
    updateTag(CACHE_TAGS.projects);
    updateTag(CACHE_TAGS.project(saved.slug));
    if (saved.previousSlug && saved.previousSlug !== saved.slug) {
      updateTag(CACHE_TAGS.project(saved.previousSlug));
    }
    return {
      ok: true,
      id: saved.id,
      slug: saved.slug,
      publishedAt: saved.publishedAt,
    };
  } catch (error) {
    if (error instanceof SlugTakenError) {
      return invalid({ slug: "Another project already uses this URL." });
    }
    if (error instanceof ContentMissingError) return missing("project");
    throw error;
  }
}

export async function deleteProjectAction(id: string) {
  await requireAdmin();
  const slug = await deleteProject(id);
  if (slug) {
    updateTag(CACHE_TAGS.projects);
    updateTag(CACHE_TAGS.project(slug));
  }
  redirect("/admin");
}

export async function moveProjectAction(id: string, direction: "up" | "down") {
  await requireAdmin();
  if (await moveProject(id, direction)) {
    updateTag(CACHE_TAGS.projects);
  }
  refresh();
}

/* Posts -------------------------------------------------------------------- */

export async function savePostAction(
  id: string | null,
  input: PostInput,
): Promise<SaveResult> {
  if (!(await getAdmin())) return SIGNED_OUT;

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) return invalid(fieldErrorsOf(parsed.error));

  try {
    const saved = await savePost(id, parsed.data);
    updateTag(CACHE_TAGS.posts);
    updateTag(CACHE_TAGS.post(saved.slug));
    if (saved.previousSlug && saved.previousSlug !== saved.slug) {
      updateTag(CACHE_TAGS.post(saved.previousSlug));
    }
    return {
      ok: true,
      id: saved.id,
      slug: saved.slug,
      publishedAt: saved.publishedAt,
    };
  } catch (error) {
    if (error instanceof SlugTakenError) {
      return invalid({ slug: "Another post already uses this URL." });
    }
    if (error instanceof ContentMissingError) return missing("post");
    throw error;
  }
}

export async function deletePostAction(id: string) {
  await requireAdmin();
  const slug = await deletePost(id);
  if (slug) {
    updateTag(CACHE_TAGS.posts);
    updateTag(CACHE_TAGS.post(slug));
  }
  redirect("/admin");
}

/* About page --------------------------------------------------------------- */

export async function saveAboutAction(
  input: AboutInput,
): Promise<AboutSaveResult> {
  if (!(await getAdmin())) return SIGNED_OUT;

  const parsed = aboutInputSchema.safeParse(input);
  if (!parsed.success) return invalid(fieldErrorsOf(parsed.error));

  await saveAbout(parsed.data);
  updateTag(CACHE_TAGS.about);
  return { ok: true };
}
