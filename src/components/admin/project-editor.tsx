"use client";

import type { Route } from "next";
import { useState } from "react";

import { deleteProjectAction, saveProjectAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  firstError,
  PublishFields,
  SlugField,
  TextField,
} from "@/components/admin/editor-fields";
import { labelClass } from "@/components/admin/form";
import { GalleryField } from "@/components/admin/gallery-field";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { SaveBar } from "@/components/admin/save-bar";
import { TokenInput } from "@/components/admin/token-input";
import { useEditor } from "@/components/admin/use-editor";
import type { EditableProject } from "@/data/admin";
import { slugify } from "@/lib/slug";
import type { UploadMode } from "@/lib/uploads/shared";
import { errorsAt, type ProjectInput } from "@/lib/validation";

type ProjectEditorProps = {
  /** null for a new project. */
  project: EditableProject | null;
  tagSuggestions: string[];
  uploadMode: UploadMode;
};

const EMPTY: ProjectInput = {
  title: "",
  slug: "",
  tagline: "",
  summary: "",
  body: "",
  coverImage: null,
  gallery: [],
  techStack: [],
  tags: [],
  repoUrl: "",
  liveUrl: "",
  featured: false,
  status: "draft",
  publishedAt: "",
};

function toInput(project: EditableProject): ProjectInput {
  const { id, ...input } = project;
  return input;
}

export function ProjectEditor({
  project,
  tagSuggestions,
  uploadMode,
}: ProjectEditorProps) {
  const {
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
  } = useEditor(project ? toInput(project) : EMPTY);
  // New projects take their URL from the title until it's edited by hand.
  const [slugEdited, setSlugEdited] = useState(project !== null);
  const [liveSlug, setLiveSlug] = useState(
    project?.status === "published" ? project.slug : null,
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(
      (sent) => saveProjectAction(project?.id ?? null, sent),
      (result, sent) => {
        setLiveSlug(sent.status === "published" ? result.slug : null);
        return {
          changes: { publishedAt: result.publishedAt },
          message:
            sent.status === "published"
              ? "Saved. The live page is updated."
              : "Saved as a draft.",
          // A new project continues on its own edit page.
          redirectTo: project
            ? undefined
            : (`/admin/projects/${result.id}` as Route),
        };
      },
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      // While a new project saves and its edit page opens, anything typed
      // would be lost, so the form is locked until then.
      inert={saving && !project}
    >
      <AdminPageHeader
        title={project ? "Edit project" : "New project"}
        description={
          project
            ? values.title || "Untitled project"
            : "Fill in the details, then save it as a draft or publish it."
        }
      />

      <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-7">
          <TextField
            id={fieldId("title")}
            label="Title"
            value={values.title}
            onChange={(title) =>
              setValues((current) => ({
                ...current,
                title,
                slug: slugEdited ? current.slug : slugify(title),
              }))
            }
            error={errors.title}
          />
          <SlugField
            id={fieldId("slug")}
            prefix="/projects/"
            value={values.slug}
            onChange={(slug) => {
              setSlugEdited(true);
              set("slug", slug);
            }}
            error={errors.slug}
            live={liveSlug !== null}
            autoFill={!slugEdited}
          />
          <TextField
            id={fieldId("tagline")}
            label="Tagline"
            hint="One line, shown under the title on cards."
            value={values.tagline}
            onChange={(tagline) => set("tagline", tagline)}
            error={errors.tagline}
          />
          <TextField
            id={fieldId("summary")}
            label="Summary"
            hint="A short paragraph for search results and link previews."
            value={values.summary}
            onChange={(summary) => set("summary", summary)}
            error={errors.summary}
            multiline={3}
          />
        </div>

        <aside className="space-y-8">
          <PublishFields
            dateId={fieldId("publishedAt")}
            status={values.status}
            publishedAt={values.publishedAt}
            onStatusChange={(status) => set("status", status)}
            onDateChange={(date) => set("publishedAt", date)}
            errors={errors}
          />
          <div>
            <p className={labelClass}>Home page</p>
            <label className="mt-3 flex items-start gap-2.5 text-sm text-star">
              <input
                type="checkbox"
                checked={values.featured}
                onChange={(event) => set("featured", event.target.checked)}
                className="mt-0.5 size-4 accent-flare"
              />
              <span>
                Feature this project
                <span className="block text-xs text-faint">
                  Featured projects appear on the home page once published.
                </span>
              </span>
            </label>
          </div>
          <ImageField
            id={fieldId("coverImage")}
            label="Cover image"
            hint="Shown on cards and at the top of the page. 1200 × 630 fits cards without cropping."
            value={values.coverImage}
            onChange={(image) => set("coverImage", image)}
            uploadMode={uploadMode}
            errors={errorsAt(errors, "coverImage")}
          />
        </aside>
      </div>

      <div className="mt-12">
        <MarkdownEditor
          id={fieldId("body")}
          label="Write-up"
          hint="Start sections with ## headings. Paste or drop images straight into the text."
          value={values.body}
          onChange={(body) => set("body", body)}
          uploadMode={uploadMode}
          error={errors.body}
        />
      </div>

      <div className="mt-12 grid gap-x-12 gap-y-8 lg:grid-cols-2">
        <TokenInput
          id={fieldId("tags")}
          label="Tags"
          hint="Used to filter the projects page. Press Enter after each one."
          values={values.tags}
          onChange={(tags) => set("tags", tags)}
          suggestions={tagSuggestions}
          placeholder="Audio, Graphics…"
          error={firstError(errors, "tags")}
        />
        <TokenInput
          id={fieldId("techStack")}
          label="Built with"
          hint="Languages and tools, in the order you want them shown."
          values={values.techStack}
          onChange={(techStack) => set("techStack", techStack)}
          placeholder="TypeScript, Three.js…"
          error={firstError(errors, "techStack")}
        />
        <TextField
          id={fieldId("liveUrl")}
          label="Live site"
          type="url"
          placeholder="https://"
          value={values.liveUrl}
          onChange={(liveUrl) => set("liveUrl", liveUrl)}
          error={errors.liveUrl}
        />
        <TextField
          id={fieldId("repoUrl")}
          label="Source code"
          type="url"
          placeholder="https://github.com/…"
          value={values.repoUrl}
          onChange={(repoUrl) => set("repoUrl", repoUrl)}
          error={errors.repoUrl}
        />
      </div>

      <div className="mt-12">
        <GalleryField
          id={fieldId("gallery")}
          label="Gallery"
          hint="Extra screenshots, shown at the end of the project page."
          value={values.gallery}
          onChange={(gallery) => set("gallery", gallery)}
          uploadMode={uploadMode}
          errors={errorsAt(errors, "gallery")}
        />
      </div>

      <SaveBar
        saving={saving}
        dirty={dirty}
        savedMessage={savedMessage}
        failure={failure}
        viewHref={liveSlug ? `/projects/${liveSlug}` : null}
      >
        {project ? (
          <ConfirmDialog
            triggerLabel="Delete"
            title="Delete this project?"
            description={`"${values.title || "Untitled project"}" will be removed from the site permanently. Its uploaded images stay in storage.`}
            confirmLabel="Delete project"
            pendingLabel="Deleting…"
            onConfirm={() => deleteProjectAction(project.id)}
          />
        ) : null}
      </SaveBar>
    </form>
  );
}
