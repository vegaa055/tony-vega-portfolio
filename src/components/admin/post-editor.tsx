"use client";

import type { Route } from "next";
import { useState } from "react";

import { deletePostAction, savePostAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  firstError,
  PublishFields,
  SlugField,
  TextField,
} from "@/components/admin/editor-fields";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { SaveBar } from "@/components/admin/save-bar";
import { TokenInput } from "@/components/admin/token-input";
import { useEditor } from "@/components/admin/use-editor";
import type { EditablePost } from "@/data/admin";
import { slugify } from "@/lib/slug";
import type { UploadMode } from "@/lib/uploads/shared";
import { errorsAt, type PostInput } from "@/lib/validation";

type PostEditorProps = {
  /** null for a new post. */
  post: EditablePost | null;
  tagSuggestions: string[];
  uploadMode: UploadMode;
};

const EMPTY: PostInput = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: null,
  tags: [],
  status: "draft",
  publishedAt: "",
};

function toInput(post: EditablePost): PostInput {
  const { id, ...input } = post;
  return input;
}

export function PostEditor({
  post,
  tagSuggestions,
  uploadMode,
}: PostEditorProps) {
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
  } = useEditor(post ? toInput(post) : EMPTY);
  const [slugEdited, setSlugEdited] = useState(post !== null);
  const [liveSlug, setLiveSlug] = useState(
    post?.status === "published" ? post.slug : null,
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(
      (sent) => savePostAction(post?.id ?? null, sent),
      (result, sent) => {
        setLiveSlug(sent.status === "published" ? result.slug : null);
        return {
          changes: { publishedAt: result.publishedAt },
          message:
            sent.status === "published"
              ? "Saved. The live post is updated."
              : "Saved as a draft.",
          // A new post continues on its own edit page.
          redirectTo: post ? undefined : (`/admin/posts/${result.id}` as Route),
        };
      },
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      // While a new post saves and its edit page opens, anything typed would
      // be lost, so the form is locked until then.
      inert={saving && !post}
    >
      <AdminPageHeader
        title={post ? "Edit post" : "New post"}
        description={
          post
            ? values.title || "Untitled post"
            : "Write it here, then save it as a draft or publish it."
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
            prefix="/blog/"
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
            id={fieldId("excerpt")}
            label="Excerpt"
            hint="A sentence or two for the blog list and link previews."
            value={values.excerpt}
            onChange={(excerpt) => set("excerpt", excerpt)}
            error={errors.excerpt}
            multiline={3}
          />
          <TokenInput
            id={fieldId("tags")}
            label="Tags"
            hint="Press Enter after each one."
            values={values.tags}
            onChange={(tags) => set("tags", tags)}
            suggestions={tagSuggestions}
            error={firstError(errors, "tags")}
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
          <ImageField
            id={fieldId("coverImage")}
            label="Cover image (optional)"
            hint="Shown at the top of the post and in link previews."
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
          label="Post"
          hint="Start sections with ## headings. Paste or drop images straight into the text."
          value={values.body}
          onChange={(body) => set("body", body)}
          uploadMode={uploadMode}
          error={errors.body}
        />
      </div>

      <SaveBar
        saving={saving}
        dirty={dirty}
        savedMessage={savedMessage}
        failure={failure}
        viewHref={liveSlug ? `/blog/${liveSlug}` : null}
      >
        {post ? (
          <ConfirmDialog
            triggerLabel="Delete"
            title="Delete this post?"
            description={`"${values.title || "Untitled post"}" will be removed from the site permanently. Its uploaded images stay in storage.`}
            confirmLabel="Delete post"
            pendingLabel="Deleting…"
            onConfirm={() => deletePostAction(post.id)}
          />
        ) : null}
      </SaveBar>
    </form>
  );
}
