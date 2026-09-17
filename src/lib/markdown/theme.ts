import type { ThemeRegistration } from "shiki/core";

/**
 * Syntax highlighting theme built from the site palette: neutral text, the
 * flare accent for keywords, and muted planet colors (sand, periwinkle, clay,
 * cream) for the rest.
 * Every token color keeps at least 4.5:1 contrast on the code background.
 */
export const deepFieldTheme: ThemeRegistration = {
  // Shiki adds this name as a class on every code block, so it must not match
  // any class the site styles.
  name: "deep-field-code",
  type: "dark",
  colors: {
    "editor.background": "#0a0c14",
    "editor.foreground": "#d7dbe6",
  },
  tokenColors: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: "#7a839b", fontStyle: "italic" },
    },
    {
      scope: [
        "keyword",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.expression",
      ],
      settings: { foreground: "#ff8c73" },
    },
    {
      scope: [
        "string",
        "string.quoted",
        "string.template",
        "punctuation.definition.string",
      ],
      settings: { foreground: "#e2d2b4" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "support.constant",
        "variable.other.constant",
      ],
      settings: { foreground: "#8fa3d9" },
    },
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#eceef5" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.name.namespace",
        "support.type",
        "support.class",
        "storage.type.primitive",
        "storage.type.built-in",
      ],
      settings: { foreground: "#b9c6ff" },
    },
    {
      scope: ["variable.parameter", "entity.other.attribute-name"],
      settings: { foreground: "#c9beb3" },
    },
    {
      scope: ["entity.name.tag", "punctuation.definition.tag"],
      settings: { foreground: "#ff8c73" },
    },
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: "#8a93a8" },
    },
    {
      scope: ["markup.inserted"],
      settings: { foreground: "#9fd6a8" },
    },
    {
      scope: ["markup.deleted"],
      settings: { foreground: "#ff8c73" },
    },
    {
      scope: ["markup.heading", "markup.bold"],
      settings: { foreground: "#eceef5", fontStyle: "bold" },
    },
  ],
};
