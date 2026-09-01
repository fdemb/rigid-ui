import * as stylex from "@stylexjs/stylex";
import { For, Show, createMemo, createSignal } from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../styles/tokens.stylex";
export interface CodeBlockProps {
  code: string;
  path?: string;
  language?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  xstyle?: stylex.StyleXStyles;
}

type TokenType = "keyword" | "type" | "string" | "number" | "comment" | "punct" | "ident" | "plain";

interface Token {
  type: TokenType;
  text: string;
}

const keywords: Record<string, true> = {
  import: true,
  export: true,
  from: true,
  as: true,
  default: true,
  type: true,
  interface: true,
  const: true,
  let: true,
  var: true,
  function: true,
  return: true,
  if: true,
  else: true,
  switch: true,
  case: true,
  break: true,
  continue: true,
  for: true,
  while: true,
  do: true,
  try: true,
  catch: true,
  finally: true,
  throw: true,
  void: true,
  null: true,
  undefined: true,
  true: true,
  false: true,
  async: true,
  await: true,
  yield: true,
  class: true,
  extends: true,
  implements: true,
  new: true,
  this: true,
  typeof: true,
  keyof: true,
  instanceof: true,
  in: true,
  is: true,
  satisfies: true,
  readonly: true,
  declare: true,
  enum: true,
  number: true,
  string: true,
  boolean: true,
  symbol: true,
  any: true,
  unknown: true,
  never: true,
};

function tokenizeCode(code: string): Token[][] {
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const result: Token[][] = [];
  let inBlockComment = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? "";
    const lineTokens: Token[] = [];
    let i = 0;

    if (inBlockComment) {
      const endIdx = line.indexOf("*/");
      if (endIdx !== -1) {
        lineTokens.push({ type: "comment", text: line.slice(0, endIdx + 2) });
        i = endIdx + 2;
        inBlockComment = false;
      } else {
        lineTokens.push({ type: "comment", text: line });
        result.push(lineTokens);
        continue;
      }
    }

    while (i < line.length) {
      if (line.slice(i, i + 2) === "/*") {
        const endIdx = line.indexOf("*/", i + 2);
        if (endIdx !== -1) {
          lineTokens.push({ type: "comment", text: line.slice(i, endIdx + 2) });
          i = endIdx + 2;
        } else {
          lineTokens.push({ type: "comment", text: line.slice(i) });
          inBlockComment = true;
          break;
        }
        continue;
      }

      if (line.slice(i, i + 2) === "//") {
        lineTokens.push({ type: "comment", text: line.slice(i) });
        break;
      }

      if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
        const quote = line[i];
        let end = i + 1;
        while (end < line.length) {
          if (line[end] === "\\") {
            end += 2;
          } else if (line[end] === quote) {
            end++;
            break;
          } else {
            end++;
          }
        }
        lineTokens.push({ type: "string", text: line.slice(i, end) });
        i = end;
        continue;
      }

      if (/[a-zA-Z_$]/.test(line[i] ?? "")) {
        let end = i + 1;
        while (end < line.length && /[a-zA-Z0-9_$]/.test(line[end] ?? "")) {
          end++;
        }
        const word = line.slice(i, end);
        if (keywords[word]) {
          lineTokens.push({ type: "keyword", text: word });
        } else if (/^[A-Z][a-zA-Z0-9_$]*$/.test(word)) {
          lineTokens.push({ type: "type", text: word });
        } else {
          lineTokens.push({ type: "ident", text: word });
        }
        i = end;
        continue;
      }

      if (/[0-9]/.test(line[i] ?? "")) {
        let end = i + 1;
        while (end < line.length && /[0-9.xXbBoOa-fA-F_]/.test(line[end] ?? "")) {
          end++;
        }
        lineTokens.push({ type: "number", text: line.slice(i, end) });
        i = end;
        continue;
      }

      if (/[{}()[\].,:;=><!~?&|*+\-/%^]/.test(line[i] ?? "")) {
        lineTokens.push({ type: "punct", text: line[i] ?? "" });
        i++;
        continue;
      }

      let end = i + 1;
      while (
        end < line.length &&
        !/[a-zA-Z0-9_$"'`{}()[\].,:;=><!~?&|*+\-/%^]/.test(line[end] ?? "") &&
        line.slice(end, end + 2) !== "//" &&
        line.slice(end, end + 2) !== "/*"
      ) {
        end++;
      }
      lineTokens.push({ type: "plain", text: line.slice(i, end) });
      i = end;
    }

    result.push(lineTokens);
  }

  // Remove trailing single empty line if present
  if (result.length > 1 && result[result.length - 1]?.length === 0) {
    result.pop();
  }

  return result;
}

const styles = stylex.create({
  root: {
    backgroundColor: tokens.codeBackground,
    borderColor: tokens.border,
    borderRadius: tokens.radiusMd,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.025)",
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    gap: "0.5rem",
    justifyContent: "space-between",
    minHeight: "2.5rem",
    paddingBlock: "0.4rem",
    paddingInline: "0.85rem",
  },
  headerLeft: {
    alignItems: "center",
    display: "flex",
    gap: "0.55rem",
    minWidth: 0,
  },
  badge: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: tokens.radiusSm,
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens.codeText,
    display: "inline-flex",
    fontFamily: tokens.fontMono,
    fontSize: "0.6875rem",
    fontWeight: 700,
    justifyContent: "center",
    lineHeight: 1,
    paddingBlock: "0.15rem",
    paddingInline: "0.35rem",
    userSelect: "none",
  },
  path: {
    color: tokens.codeTextMuted,
    fontFamily: tokens.fontMono,
    fontSize: "0.8125rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  headerRight: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    gap: "0.5rem",
  },
  headerToggle: {
    alignItems: "center",
    appearance: "none",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: {
      default: tokens.codeTextMuted,
      ":hover": tokens.codeText,
    },
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    lineHeight: 1,
    paddingBlock: "0.3rem",
    paddingInline: "0.4rem",
    transition: `color ${tokens.durationFast} ${tokens.easing}`,
  },
  divider: {
    backgroundColor: tokens.border,
    height: "0.85rem",
    width: 1,
  },
  copyButton: {
    alignItems: "center",
    appearance: "none",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: tokens.radiusSm,
    borderStyle: "solid",
    borderWidth: 1,
    color: {
      default: tokens.codeTextMuted,
      ":hover": tokens.codeText,
    },
    cursor: "pointer",
    display: "inline-flex",
    height: "1.75rem",
    justifyContent: "center",
    padding: 0,
    transition: `color ${tokens.durationFast} ${tokens.easing}, background-color ${tokens.durationFast} ${tokens.easing}`,
    width: "1.75rem",
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
  },
  copyIcon: {
    display: "block",
    height: "0.875rem",
    width: "0.875rem",
  },
  codeArea: {
    backgroundColor: tokens.codeBackground,
    display: "flex",
    fontFamily: tokens.fontMono,
    fontSize: "0.8125rem",
    lineHeight: 1.65,
    margin: 0,
    overflowX: "auto",
    paddingBlock: "0.85rem",
    paddingInline: "0.85rem",
    position: "relative",
  },
  codeAreaCollapsed: {
    maxHeight: "16rem",
    overflow: "hidden",
  },
  gutter: {
    color: tokens.codeTextMuted,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    opacity: 0.45,
    paddingInlineEnd: "1.25rem",
    textAlign: "right",
    userSelect: "none",
  },
  codeContent: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0,
    whiteSpace: "pre",
  },
  line: {
    display: "block",
    minHeight: "1.35rem",
  },
  fadeOverlay: {
    alignItems: "flex-end",
    backgroundImage: `linear-gradient(to bottom, transparent 0%, ${tokens.codeBackground} 85%)`,
    bottom: 0,
    display: "flex",
    insetInline: 0,
    justifyContent: "center",
    paddingBlockEnd: "1.1rem",
    position: "absolute",
    top: "6rem",
  },
  expandButton: {
    alignItems: "center",
    appearance: "none",
    backgroundColor: tokens.surfaceInteractive,
    borderColor: tokens.borderStrong,
    borderRadius: tokens.radiusFull,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: tokens.shadowMd,
    color: tokens.text,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    fontWeight: 600,
    gap: "0.35rem",
    lineHeight: 1,
    paddingBlock: "0.4rem",
    paddingInline: "0.95rem",
    transition: `transform ${tokens.durationFast} ${tokens.easing}, background-color ${tokens.durationFast} ${tokens.easing}`,
    ":hover": {
      backgroundColor: tokens.surfaceRaised,
      transform: "translateY(-1px)",
    },
  },
  tokKeyword: { color: "#f43f5e" },
  tokType: { color: "#38bdf8" },
  tokString: { color: "#7dd3fc" },
  tokNumber: { color: "#fbbf24" },
  tokComment: { color: tokens.codeTextMuted, fontStyle: "italic", opacity: 0.8 },
  tokPunct: { color: "#94a3b8" },
  tokIdent: { color: tokens.codeText },
  tokPlain: { color: tokens.codeText },
});

const tokenStyleMap = {
  keyword: styles.tokKeyword,
  type: styles.tokType,
  string: styles.tokString,
  number: styles.tokNumber,
  comment: styles.tokComment,
  punct: styles.tokPunct,
  ident: styles.tokIdent,
  plain: styles.tokPlain,
} as const;

export default function CodeBlock(props: CodeBlockProps) {
  const merged = mergeProps(
    {
      collapsible: true,
      defaultExpanded: false,
    },
    props,
  );

  const [expanded, setExpanded] = createSignal(merged.defaultExpanded);
  const [copied, setCopied] = createSignal(false);

  const lines = createMemo(() => tokenizeCode(merged.code));
  const isCollapsible = createMemo(() => merged.collapsible && lines().length > 10);

  const languageLabel = createMemo(() => {
    if (merged.language) return merged.language;
    if (merged.path) {
      if (merged.path.endsWith(".tsx") || merged.path.endsWith(".ts")) return "TS";
      if (merged.path.endsWith(".jsx") || merged.path.endsWith(".js")) return "JS";
      if (merged.path.endsWith(".css")) return "CSS";
      if (merged.path.endsWith(".html")) return "HTML";
      if (merged.path.endsWith(".json")) return "JSON";
    }
    return "TS";
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(merged.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = merged.code;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }

  return (
    <div {...stylex.attrs(styles.root, merged.xstyle)}>
      <div {...stylex.attrs(styles.header)}>
        <div {...stylex.attrs(styles.headerLeft)}>
          <span {...stylex.attrs(styles.badge)}>{languageLabel()}</span>
          <Show when={merged.path}>
            <span {...stylex.attrs(styles.path)}>{merged.path}</span>
          </Show>
        </div>
        <div {...stylex.attrs(styles.headerRight)}>
          <Show when={isCollapsible()}>
            <button
              type="button"
              onClick={() => setExpanded(!expanded())}
              {...stylex.attrs(styles.headerToggle)}
            >
              {expanded() ? "Collapse" : "Expand"}
            </button>
            <div aria-hidden="true" {...stylex.attrs(styles.divider)} />
          </Show>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied() ? "Copied to clipboard" : "Copy code"}
            title={copied() ? "Copied!" : "Copy code"}
            {...stylex.attrs(styles.copyButton)}
          >
            <Show
              when={copied()}
              fallback={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  {...stylex.attrs(styles.copyIcon)}
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                {...stylex.attrs(styles.copyIcon)}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </Show>
          </button>
        </div>
      </div>

      <div
        {...stylex.attrs(
          styles.codeArea,
          isCollapsible() && !expanded() && styles.codeAreaCollapsed,
        )}
      >
        <div aria-hidden="true" {...stylex.attrs(styles.gutter)}>
          <For each={lines()}>
            {(_, index) => <span {...stylex.attrs(styles.line)}>{index() + 1}</span>}
          </For>
        </div>
        <pre {...stylex.attrs(styles.codeContent)}>
          <code>
            <For each={lines()}>
              {(lineTokens) => (
                <span {...stylex.attrs(styles.line)}>
                  <For each={lineTokens}>
                    {(tok) => <span {...stylex.attrs(tokenStyleMap[tok.type])}>{tok.text}</span>}
                  </For>
                  {"\n"}
                </span>
              )}
            </For>
          </code>
        </pre>
        <Show when={isCollapsible() && !expanded()}>
          <div {...stylex.attrs(styles.fadeOverlay)}>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              {...stylex.attrs(styles.expandButton)}
            >
              Expand
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}
