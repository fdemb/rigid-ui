import { createHighlighter, type Highlighter } from "@tanstack/highlight/core";
import { css } from "@tanstack/highlight/languages/css";
import { js } from "@tanstack/highlight/languages/js";
import { jsx } from "@tanstack/highlight/languages/jsx";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";

/*
 * The one highlighter this site uses. The core ships no languages, so the
 * registrations below are also the bundle plan: only what the docs render.
 * tsx covers the component sources and every ```tsx fence, ts the ```ts
 * fences and .ts paths, css the reset.css source view, js/jsx the plain
 * script variants and aliases. Anything else falls back to escaped plaintext.
 *
 * No DOM, no async init, no window checks. Importing this module on the
 * server and in the browser builds the same registry, so both paths return
 * byte-identical HTML for the same input.
 */
export const codeHighlighter: Highlighter = createHighlighter({
  languages: [css, js, jsx, ts, tsx],
});

const extensionToLanguage: Record<string, string> = {
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  mjs: "js",
  cjs: "js",
  css: "css",
};

/** Guess the highlight language from a file path. Falls back to tsx. */
export function languageFromPath(path?: string): string {
  const ext = path?.split(".").pop()?.toLowerCase();
  if (ext && extensionToLanguage[ext]) return extensionToLanguage[ext];
  return "tsx";
}

/** Resolve a label, alias, or path to the canonical registered language. */
export function resolveCodeLanguage(input?: string, path?: string): string {
  if (input) {
    const lower = input.toLowerCase();
    const byExtension = extensionToLanguage[lower];
    if (byExtension) return byExtension;
    return codeHighlighter.normalizeLanguage(lower);
  }
  return languageFromPath(path);
}

/** Short display name for a language, used when there is no file path. */
export function displayNameForLanguage(lang: string): string {
  const canonical = codeHighlighter.normalizeLanguage(lang);
  return canonical === "plaintext" ? "text" : canonical;
}
