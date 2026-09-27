import {
  renderNodesToHtml,
  renderTokens,
  type HighlightDecoration,
} from "@tanstack/highlight/core";
import { renderCodeFence } from "@tanstack/highlight/markdown";

import { codeHighlighter, resolveCodeLanguage } from "./highlighter";

export type { HighlightDecoration };

export interface CodeHighlightInput {
  code: string;
  /** Language id, alias, or extension. Guessed from `path` when omitted. */
  lang?: string;
  path?: string;
  /**
   * Fence metadata, e.g. `title="App.tsx" {2,4-6} ins={8} lineNumbers`.
   * Titles and line decorations merge with the explicit props below.
   */
  meta?: string;
  title?: string;
  lineNumbers?: boolean;
  decorations?: ReadonlyArray<HighlightDecoration>;
}

export interface CodeHighlightResult {
  /** Library-owned `<pre class="th-code ...">` tree, verbatim. */
  preHtml: string;
  copyText: string;
  lang: string;
  title?: string;
  lineCount: number;
  lineNumbers: boolean;
}

/*
 * One highlighting path for every code view on the site. `renderCodeFence`
 * trims trailing block whitespace (copy text and markup agree), merges fence
 * metadata with explicit decorations, and returns the single `th-*` tree that
 * every theme shares. Blocks default to line numbers; fence metadata can only
 * switch them on, never off.
 */
export function highlightCodeBlock(input: CodeHighlightInput): CodeHighlightResult {
  const lang = resolveCodeLanguage(input.lang, input.path);
  const fence = renderCodeFence(
    {
      code: input.code,
      decorations: input.decorations,
      lang,
      lineNumbers: input.lineNumbers ?? true,
      meta: input.meta ?? null,
      title: input.title ?? null,
    },
    codeHighlighter,
  );
  return {
    copyText: fence.copyText,
    lang: fence.lang,
    lineCount: fence.copyText === "" ? 0 : fence.copyText.split("\n").length,
    lineNumbers: fence.lineNumbers,
    preHtml: fence.htmlMarkup,
    title: fence.title,
  };
}

/** Inline spans without the `<pre>` wrapper, for `<code>` content. */
export function highlightInlineSpans(code: string, lang?: string, path?: string): string {
  const { tokens } = codeHighlighter.tokenize(code, {
    lang: resolveCodeLanguage(lang, path),
  });
  return renderNodesToHtml(renderTokens(tokens));
}
