"use client";

import { saveAboutAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { firstError, TextField } from "@/components/admin/editor-fields";
import {
  describedBy,
  Field,
  inputClass,
  labelClass,
} from "@/components/admin/form";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { SaveBar } from "@/components/admin/save-bar";
import { TokenInput } from "@/components/admin/token-input";
import { useEditor } from "@/components/admin/use-editor";
import { buttonClass } from "@/components/button-link";
import type { EditableAbout } from "@/data/admin";
import type { UploadMode } from "@/lib/uploads/shared";
import { errorsAt, type AboutInput } from "@/lib/validation";

// List items carry a client-only key so React keeps inputs attached to the
// right item when they're reordered. The server ignores unknown fields.
let nextKey = 0;
const newKey = () => `item-${nextKey++}`;

type Keyed<T> = T & { key: string };
type SkillDraft = Keyed<AboutInput["skills"][number]>;
type ExperienceDraft = Keyed<AboutInput["experience"][number]>;
type AboutDraft = Omit<AboutInput, "skills" | "experience"> & {
  skills: SkillDraft[];
  experience: ExperienceDraft[];
};

function toDraft(about: EditableAbout): AboutDraft {
  return {
    ...about,
    skills: about.skills.map((group) => ({ ...group, key: newKey() })),
    experience: about.experience.map((entry) => ({ ...entry, key: newKey() })),
  };
}

function moved<T>(items: T[], index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

type AboutEditorProps = {
  about: EditableAbout;
  uploadMode: UploadMode;
};

export function AboutEditor({ about, uploadMode }: AboutEditorProps) {
  const {
    formRef,
    values,
    set,
    dirty,
    errors,
    failure,
    saving,
    savedMessage,
    fieldId,
    save,
  } = useEditor(toDraft(about));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(saveAboutAction, () => ({
      message: "Saved. The About page is updated.",
    }));
  }

  const updateSkill = (index: number, patch: Partial<SkillDraft>) =>
    set(
      "skills",
      values.skills.map((group, position) =>
        position === index ? { ...group, ...patch } : group,
      ),
    );

  const updateEntry = (index: number, patch: Partial<ExperienceDraft>) =>
    set(
      "experience",
      values.experience.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    );

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <AdminPageHeader
        title="About page"
        description="Your bio, portrait, skills, and experience."
      />

      <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-7">
          <TextField
            id={fieldId("headline")}
            label="Headline"
            hint="Shown under the page title."
            value={values.headline}
            onChange={(headline) => set("headline", headline)}
            error={errors.headline}
            multiline={2}
          />
        </div>
        <aside>
          <ImageField
            id={fieldId("portrait")}
            label="Portrait"
            hint="A square photo works best."
            value={values.portrait}
            onChange={(portrait) => set("portrait", portrait)}
            uploadMode={uploadMode}
            errors={errorsAt(errors, "portrait")}
          />
        </aside>
      </div>

      <div className="mt-12">
        <MarkdownEditor
          id={fieldId("bio")}
          label="Bio"
          value={values.bio}
          onChange={(bio) => set("bio", bio)}
          uploadMode={uploadMode}
          error={errors.bio}
        />
      </div>

      {/* Skills ----------------------------------------------------------- */}
      <fieldset className="mt-14">
        <legend className={labelClass}>Skills</legend>
        <p className="mt-1.5 text-xs text-faint">
          Groups of skills, each shown as a list of labels.
        </p>

        <ol className="mt-5 grid gap-4 lg:grid-cols-2">
          {values.skills.map((group, index) => {
            const labelId = fieldId(`skills-${index}-label`);
            const groupError = errors[`skills.${index}.label`];
            return (
              <li
                key={group.key}
                className="space-y-4 rounded-xs border border-line p-4"
              >
                <Field
                  id={labelId}
                  label={`Group ${index + 1} name`}
                  error={groupError}
                >
                  <input
                    id={labelId}
                    value={group.label}
                    onChange={(event) =>
                      updateSkill(index, { label: event.target.value })
                    }
                    aria-invalid={Boolean(groupError)}
                    aria-describedby={describedBy(
                      labelId,
                      undefined,
                      groupError,
                    )}
                    className={inputClass}
                  />
                </Field>
                <TokenInput
                  id={fieldId(`skills-${index}-items`)}
                  label="Skills"
                  values={group.items}
                  onChange={(items) => updateSkill(index, { items })}
                  error={firstError(errors, `skills.${index}.items`)}
                />
                <ItemControls
                  name={`group ${index + 1}`}
                  index={index}
                  count={values.skills.length}
                  onMove={(offset) =>
                    set("skills", moved(values.skills, index, offset))
                  }
                  onRemove={() =>
                    set(
                      "skills",
                      values.skills.filter((_, position) => position !== index),
                    )
                  }
                />
              </li>
            );
          })}
        </ol>
        <ListError message={errors.skills} />
        <button
          type="button"
          onClick={() =>
            set("skills", [
              ...values.skills,
              { key: newKey(), label: "", items: [] },
            ])
          }
          className={buttonClass("ghost", "sm") + " mt-4"}
        >
          Add a skill group
        </button>
      </fieldset>

      {/* Experience ------------------------------------------------------- */}
      <fieldset className="mt-14">
        <legend className={labelClass}>Experience</legend>
        <p className="mt-1.5 text-xs text-faint">
          Work and education, shown as two timelines in the order listed here.
        </p>

        <ol className="mt-5 space-y-4">
          {values.experience.map((entry, index) => {
            const prefix = `experience.${index}`;
            const idPrefix = fieldId(`experience-${index}`);
            return (
              <li
                key={entry.key}
                className="grid gap-4 rounded-xs border border-line p-4 md:grid-cols-2"
              >
                <Field id={`${idPrefix}-kind`} label="Type">
                  <select
                    id={`${idPrefix}-kind`}
                    value={entry.kind}
                    onChange={(event) =>
                      updateEntry(index, {
                        kind: event.target.value as ExperienceDraft["kind"],
                      })
                    }
                    className={inputClass}
                  >
                    <option value="work">Work</option>
                    <option value="education">Education</option>
                  </select>
                </Field>
                <TextField
                  id={`${idPrefix}-period`}
                  label="When"
                  placeholder="Jul 2024 – Jul 2025"
                  value={entry.period}
                  onChange={(period) => updateEntry(index, { period })}
                  error={errors[`${prefix}.period`]}
                />
                <TextField
                  id={`${idPrefix}-role`}
                  label={entry.kind === "work" ? "Role" : "Degree or program"}
                  value={entry.role}
                  onChange={(role) => updateEntry(index, { role })}
                  error={errors[`${prefix}.role`]}
                />
                <TextField
                  id={`${idPrefix}-organization`}
                  label={entry.kind === "work" ? "Organization" : "School"}
                  value={entry.organization}
                  onChange={(organization) =>
                    updateEntry(index, { organization })
                  }
                  error={errors[`${prefix}.organization`]}
                />
                <div className="md:col-span-2">
                  <TextField
                    id={`${idPrefix}-description`}
                    label="Description"
                    value={entry.description}
                    onChange={(description) =>
                      updateEntry(index, { description })
                    }
                    error={errors[`${prefix}.description`]}
                    multiline={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <ItemControls
                    name={`entry ${index + 1}`}
                    index={index}
                    count={values.experience.length}
                    onMove={(offset) =>
                      set("experience", moved(values.experience, index, offset))
                    }
                    onRemove={() =>
                      set(
                        "experience",
                        values.experience.filter(
                          (_, position) => position !== index,
                        ),
                      )
                    }
                  />
                </div>
              </li>
            );
          })}
        </ol>
        <ListError message={errors.experience} />
        <button
          type="button"
          onClick={() =>
            set("experience", [
              ...values.experience,
              {
                key: newKey(),
                kind: "work",
                role: "",
                organization: "",
                period: "",
                description: "",
              },
            ])
          }
          className={buttonClass("ghost", "sm") + " mt-4"}
        >
          Add an entry
        </button>
      </fieldset>

      <SaveBar
        saving={saving}
        dirty={dirty}
        savedMessage={savedMessage}
        failure={failure}
        viewHref="/about"
      />
    </form>
  );
}

/** An error about a whole list, like having too many entries. */
function ListError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-3 text-xs text-flare-soft">{message}</p>;
}

type ItemControlsProps = {
  /** e.g. "entry 2", used in the buttons' accessible names. */
  name: string;
  index: number;
  count: number;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
};

function ItemControls({
  name,
  index,
  count,
  onMove,
  onRemove,
}: ItemControlsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label={`Move ${name} up`}
        className={buttonClass("quiet", "sm")}
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        aria-label={`Move ${name} down`}
        className={buttonClass("quiet", "sm")}
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className={buttonClass("quiet", "sm")}
      >
        Remove
      </button>
    </div>
  );
}
