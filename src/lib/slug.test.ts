import { describe, expect, it } from "vitest";

import { SLUG_PATTERN, slugify } from "./slug";
import { slugParams } from "./static-params";

describe("slugify", () => {
  it("lowercases words and joins them with hyphens", () => {
    expect(slugify("Machine Learning")).toBe("machine-learning");
  });

  it("drops accents and punctuation", () => {
    expect(slugify("Café & Crème: Brûlée!")).toBe("cafe-creme-brulee");
  });

  it("collapses repeated separators and trims the ends", () => {
    expect(slugify("  --3D   Solar__System--  ")).toBe("3d-solar-system");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("¿¡!?")).toBe("");
  });
});

describe("SLUG_PATTERN", () => {
  it.each(["3d-solar-system", "post", "a1-b2"])("accepts %j", (slug) => {
    expect(SLUG_PATTERN.test(slug)).toBe(true);
  });

  it.each([
    "",
    "Upper",
    "double--hyphen",
    "-leading",
    "trailing-",
    "under_score",
    "space here",
  ])("rejects %j", (slug) => {
    expect(SLUG_PATTERN.test(slug)).toBe(false);
  });

  it("accepts whatever slugify makes from a real title", () => {
    for (const title of [
      "Wyze Beatz",
      "5 Rules to Survive Tower 3",
      "Cryptid Hunter: Rogue",
    ]) {
      expect(SLUG_PATTERN.test(slugify(title))).toBe(true);
    }
  });
});

describe("slugParams", () => {
  it("turns slugs into route params", () => {
    expect(slugParams(["a", "b"])).toEqual([{ slug: "a" }, { slug: "b" }]);
  });

  it("falls back to a placeholder that no real slug can match", () => {
    const params = slugParams([]);
    expect(params).toHaveLength(1);
    expect(SLUG_PATTERN.test(params[0].slug)).toBe(false);
  });
});
