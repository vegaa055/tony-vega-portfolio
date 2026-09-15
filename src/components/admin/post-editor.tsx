"use client";

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
    save,
  } = useEditor(post ? toInput(post) : EMPTY);
  // null until a new post is saved for the first time.
  const [postId, setPostId] = useState(post?.id ?? null);
  const [slugEdited, setSlugEdited] = useState(post !== null);
  const [liveSlug, setLiveSlug] = useState(
    post?.status === "published" ? post.slug : null,
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(
      (sent) => savePostAction(postId, sent),
      (result, sent) => {
        setLiveSlug(sent.status === "published" ? result.slug : null);
        if (!postId) {
          setPostId(result.id);
          // Point the address at the new post without reloading the editor.
          window.history.replaceState(null, "", `/admin/posts/${result.id}`);
        }
        return {
          changes: { publishedAt: result.publishedAt },
          message:
            sent.status === "published"
              ? "Saved. The live post is updated."
              : "Saved as a draft.",
        };
      },
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <AdminPageHeader
        title={postId ? "Edit post" : "New post"}
        description={
          postId
            ? values.title || "Untitled post"
            : "Write it here, then save it as a draft or publish it."
        }
      />

      <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-7">
          <TextField
            id="title"
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
            id="slug"
            prefix="/blog/"
            value={values.slug}
            onChange={(slug) => {
              setSlugEdited(true);
              set("slug", slug);
            }}
            error={errors.slug}
            live={liveSlug !== null}
          />
          <TextField
            id="excerpt"
            label="Excerpt"
            hint="A sentence or two for the blog list and link previews."
            value={values.excerpt}
            onChange={(excerpt) => set("excerpt", excerpt)}
            error={errors.excerpt}
            multiline={3}
          />
          <TokenInput
            id="tags"
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
            status={values.status}
            publishedAt={values.publishedAt}
            onStatusChange={(status) => set("status", status)}
            onDateChange={(date) => set("publishedAt", date)}
            errors={errors}
          />
          <ImageField
            id="coverImage"
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
          id="body"
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
        {postId ? (
          <ConfirmDialog
            triggerLabel="Delete"
            title="Delete this post?"
            description={`"${values.title || "Untitled post"}" will be removed from the site permanently. Its uploaded images stay in storage.`}
            confirmLabel="Delete post"
            pendingLabel="Deleting…"
            onConfirm={() => deletePostAction(postId)}
          />
        ) : null}
      </SaveBar>
    </form>
  );
}
