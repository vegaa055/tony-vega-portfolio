import { describe, expect, it } from "vitest";

import {
  aboutInputSchema,
  errorsAt,
  fieldErrorsOf,
  isAllowedImageUrl,
  postInputSchema,
  projectInputSchema,
  type PostInput,
  type ProjectInput,
} from "./validation";

const post: PostInput = {
  title: "Hello",
  slug: "hello",
  excerpt: "",
  body: "Some text.",
  coverImage: null,
  tags: [],
  status: "draft",
  publishedAt: "",
};

const project: ProjectInput = {
  title: "Orbit",
  slug: "orbit",
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

/** The field errors from parsing, keyed by path ("gallery.0.alt"). */
function errorsFor(result: { success: boolean; error?: unknown }) {
  expect(result.success).toBe(false);
  return fieldErrorsOf(result.error as Parameters<typeof fieldErrorsOf>[0]);
}

describe("isAllowedImageUrl", () => {
  it.each([
    "/images/projects/orbit/cover.webp",
    "/uploads/4f1c2a8e-0b7d-4c3e-9a1f-2d5e6b7c8d9e.png",
    "https://abc123.public.blob.vercel-storage.com/uploads/photo.png",
  ])("accepts the site's own images: %s", (url) => {
    expect(isAllowedImageUrl(url)).toBe(true);
  });

  it.each([
    "https://example.com/photo.png",
    "http://abc123.public.blob.vercel-storage.com/photo.png",
    "https://public.blob.vercel-storage.com.example.com/photo.png",
    "//example.com/photo.png",
    "javascript:alert(1)",
    "/other/photo.png",
    "/images/../../.env.local",
    "/uploads/%2e%2e/secret.png",
    "/images/a photo.png",
    "",
  ])("rejects anything else: %j", (url) => {
    expect(isAllowedImageUrl(url)).toBe(false);
  });
});

describe("postInputSchema", () => {
  it("accepts a minimal draft and trims text", () => {
    const result = postInputSchema.parse({ ...post, title: "  Hello  " });
    expect(result.title).toBe("Hello");
    expect(result.publishedAt).toBeNull();
  });

  it("stores a publish date at noon UTC, so it reads the same everywhere", () => {
    const result = postInputSchema.parse({
      ...post,
      publishedAt: "2026-09-14",
    });
    expect(result.publishedAt?.toISOString()).toBe("2026-09-14T12:00:00.000Z");
  });

  it("explains what's wrong with each field", () => {
    const errors = errorsFor(
      postInputSchema.safeParse({
        ...post,
        title: "   ",
        slug: "Not A Slug",
        publishedAt: "14/09/2026",
        tags: Array.from({ length: 13 }, (_, index) => `tag ${index}`),
      }),
    );
    expect(errors.title).toBe("This is required.");
    expect(errors.slug).toBe(
      "Use lowercase letters, numbers, and single hyphens.",
    );
    expect(errors.publishedAt).toBeDefined();
    expect(errors.tags).toBe("Use 12 or fewer.");
  });
});

describe("projectInputSchema", () => {
  it("turns empty links into null and keeps real ones", () => {
    const result = projectInputSchema.parse({
      ...project,
      repoUrl: "https://github.com/vegaa055/orbit",
      liveUrl: "",
    });
    expect(result.repoUrl).toBe("https://github.com/vegaa055/orbit");
    expect(result.liveUrl).toBeNull();
  });

  it.each(["not a url", "ftp://example.com", "javascript:alert(1)"])(
    "rejects the link %j",
    (liveUrl) => {
      const errors = errorsFor(
        projectInputSchema.safeParse({ ...project, liveUrl }),
      );
      expect(errors.liveUrl).toBe(
        "Enter a full address, starting with https://",
      );
    },
  );

  it("requires a description for every image, and only the site's images", () => {
    const errors = errorsFor(
      projectInputSchema.safeParse({
        ...project,
        coverImage: { url: "https://example.com/cover.png", alt: "Cover" },
        gallery: [{ url: "/uploads/one.png", alt: "  " }],
      }),
    );
    expect(errors["coverImage.url"]).toBe(
      "Upload the image rather than linking to it.",
    );
    expect(errors["gallery.0.alt"]).toBe(
      "Describe the image for people who can't see it.",
    );
  });
});

describe("aboutInputSchema", () => {
  it("requires names for skill groups and experience entries", () => {
    const errors = errorsFor(
      aboutInputSchema.safeParse({
        headline: "",
        bio: "",
        portrait: null,
        skills: [{ label: "", items: ["TypeScript"] }],
        experience: [
          {
            kind: "work",
            role: "",
            organization: "Acme",
            period: "",
            description: "",
          },
        ],
      }),
    );
    expect(errors["skills.0.label"]).toBe("This is required.");
    expect(errors["experience.0.role"]).toBe("This is required.");
  });

  it("ignores fields the editor adds for itself, like list keys", () => {
    const result = aboutInputSchema.parse({
      headline: "Hi",
      bio: "",
      portrait: null,
      skills: [{ key: "item-1", label: "Languages", items: ["TypeScript"] }],
      experience: [],
    });
    expect(result.skills[0]).toEqual({
      label: "Languages",
      items: ["TypeScript"],
    });
  });
});

describe("errorsAt", () => {
  it("picks out one field's errors, relative to that field", () => {
    const errors = {
      gallery: "Use 30 images or fewer.",
      "gallery.2.alt": "Describe the image.",
      title: "This is required.",
    };
    expect(errorsAt(errors, "gallery")).toEqual({
      "": "Use 30 images or fewer.",
      "2.alt": "Describe the image.",
    });
  });
});
