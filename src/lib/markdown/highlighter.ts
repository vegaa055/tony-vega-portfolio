import "server-only";

import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import { deepFieldTheme } from "./theme";

let highlighter: Promise<HighlighterCore> | undefined;

/**
 * One shared highlighter per server instance.
 *
 * Only the languages listed here are bundled; code blocks in any other
 * language render as plain text. The JavaScript regex engine avoids loading
 * WebAssembly, which keeps serverless cold starts fast.
 */
export function getHighlighter() {
  highlighter ??= createHighlighterCore({
    themes: [deepFieldTheme],
    langs: [
      import("shiki/langs/bash.mjs"),
      import("shiki/langs/cpp.mjs"),
      import("shiki/langs/csharp.mjs"),
      import("shiki/langs/css.mjs"),
      import("shiki/langs/diff.mjs"),
      import("shiki/langs/glsl.mjs"),
      import("shiki/langs/html.mjs"),
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/json.mjs"),
      import("shiki/langs/jsx.mjs"),
      import("shiki/langs/markdown.mjs"),
      import("shiki/langs/php.mjs"),
      import("shiki/langs/python.mjs"),
      import("shiki/langs/sql.mjs"),
      import("shiki/langs/tsx.mjs"),
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/wgsl.mjs"),
      import("shiki/langs/yaml.mjs"),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}
