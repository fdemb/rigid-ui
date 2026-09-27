import * as stylex from "@stylexjs/stylex";
import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  Show,
  useContext,
  type ParentProps,
} from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import {
  highlightCodeBlock,
  highlightInlineSpans,
  type CodeHighlightResult,
  type HighlightDecoration,
} from "../code/code-fence";
import { displayNameForLanguage, resolveCodeLanguage } from "../code/highlighter";
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FileCodeIcon,
  JavaScriptIcon,
  TypeScriptIcon,
} from "./icons";
import { Button } from "./ui/Button";
import { ScrollArea } from "./ui/ScrollArea";
import { Tooltip } from "./ui/Tooltip";
import { colors, motion, radii, shadows, typography } from "./ui/tokens.stylex";
import type { StyleProps } from "./ui/styleProps";

/*
 * Code views, all running on the one shared TanStack Highlight registry.
 *
 * `Code` is inline snippets. `CodeBlock` is a small headerless block.
 * Larger presentations compose the `CodePanel*` pieces: a root holding the
 * highlighted HTML and expand state, a header with a bare file icon plus one
 * label, primitive-backed actions, and a body whose only expand control is
 * the floating pill. `CodePanel` wires the common arrangement.
 */

const COLLAPSE_AT_LINES = 10;
const COLLAPSED_HEIGHT = "16rem";

const styles = stylex.create({
  root: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  blockRoot: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    gap: "0.5rem",
    justifyContent: "space-between",
    minHeight: "2.5rem",
    paddingBlock: "0.3rem",
    paddingInline: "0.75rem",
  },
  titleGroup: {
    alignItems: "center",
    display: "flex",
    gap: "0.5rem",
    minWidth: 0,
  },
  languageIcon: {
    flexShrink: 0,
    height: "0.9rem",
    width: "0.9rem",
  },
  fileIcon: {
    color: colors.mutedForeground,
    flexShrink: 0,
    height: "0.9rem",
    width: "0.9rem",
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.mono,
    fontSize: "0.8125rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    gap: "0.25rem",
  },
  actionIcon: {
    display: "block",
    height: "0.875rem",
    width: "0.875rem",
  },
  body: {
    position: "relative",
  },
  bodyCollapsed: {
    maxHeight: COLLAPSED_HEIGHT,
    overflow: "hidden",
  },
  scrollViewport: {
    borderRadius: 0,
    borderWidth: 0,
  },
  scrollContent: {
    padding: 0,
  },
  scrollContentPadded: {
    paddingBlockEnd: "2.75rem",
  },
  scrollTrack: {
    backgroundColor: "transparent",
  },
  scrollThumb: {
    backgroundColor: colors.scrollbar,
  },
  fadeOverlay: {
    alignItems: "flex-end",
    backgroundImage: `linear-gradient(to bottom, transparent 0%, ${colors.background} 82%)`,
    bottom: 0,
    display: "flex",
    insetInline: 0,
    justifyContent: "center",
    paddingBlockEnd: "0.9rem",
    position: "absolute",
    top: "7rem",
  },
  expandFloat: {
    bottom: "0.9rem",
    display: "flex",
    insetInline: 0,
    justifyContent: "center",
    pointerEvents: "none",
    position: "absolute",
  },
  expandButton: {
    alignItems: "center",
    backgroundColor: colors.interactive,
    borderColor: colors.borderStrong,
    borderRadius: radii.full,
    boxShadow: shadows.md,
    color: colors.foreground,
    display: "inline-flex",
    fontFamily: typography.mono,
    fontSize: "0.75rem",
    fontWeight: 600,
    gap: "0.35rem",
    lineHeight: 1,
    minHeight: "1.9rem",
    paddingBlock: "0.4rem",
    paddingInline: "0.95rem",
    pointerEvents: "auto",
  },
  expandIcon: {
    display: "block",
    height: "0.8rem",
    transition: `transform ${motion.fast} ${motion.easing}`,
    width: "0.8rem",
  },
  expandIconOpen: {
    transform: "rotate(180deg)",
  },
});

/*
 * Solid 2 types no longer include `classList`, so the scope classes the theme
 * CSS keys off (`rui-code`, `rui-code-inline`) merge with StyleX by hand.
 */
function scopedRoot(xstyle?: stylex.StyleXStyles, base: stylex.StyleXStyles = styles.root) {
  const attrs = stylex.attrs(base, xstyle);
  return { ...attrs, class: attrs.class ? `${attrs.class} rui-code` : "rui-code" };
}

function scopedInline(xstyle?: stylex.StyleXStyles) {
  const attrs = stylex.attrs(xstyle);
  return { ...attrs, class: attrs.class ? `${attrs.class} rui-code-inline` : "rui-code-inline" };
}

function LanguageIcon(props: { lang: string }) {
  const canonical = createMemo(() => resolveCodeLanguage(props.lang));
  return (
    <Show
      when={canonical() === "ts" || canonical() === "tsx"}
      fallback={
        <Show
          when={canonical() === "js" || canonical() === "jsx"}
          fallback={<FileCodeIcon aria-hidden="true" {...stylex.attrs(styles.fileIcon)} />}
        >
          <JavaScriptIcon aria-hidden="true" {...stylex.attrs(styles.languageIcon)} />
        </Show>
      }
    >
      <TypeScriptIcon aria-hidden="true" {...stylex.attrs(styles.languageIcon)} />
    </Show>
  );
}

function useCopyText(source: () => string) {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));

  async function copy() {
    const text = source();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(area);
      }
    }
    setCopied(true);
    clearTimeout(timer);
    timer = setTimeout(() => setCopied(false), 2000);
  }

  return { copied, copy };
}

/** Inline snippet sharing the block highlighter. */
export function Code(
  props: { code?: string; lang?: string; path?: string; children?: string } & StyleProps,
) {
  const source = createMemo(() => props.code ?? props.children ?? "");
  const spans = createMemo(() => highlightInlineSpans(source(), props.lang, props.path));
  return <code {...scopedInline(props.xstyle)} innerHTML={spans()} />;
}

export interface SimpleCodeBlockProps extends StyleProps {
  code: string;
  lang?: string;
  path?: string;
  meta?: string;
  title?: string;
  lineNumbers?: boolean;
  decorations?: ReadonlyArray<HighlightDecoration>;
}

/** Small headerless block. For headers and collapsing, compose the panel. */
export function CodeBlock(props: SimpleCodeBlockProps) {
  const highlighted = createMemo(() =>
    highlightCodeBlock({
      code: props.code,
      decorations: props.decorations,
      lang: props.lang,
      lineNumbers: props.lineNumbers,
      meta: props.meta,
      path: props.path,
      title: props.title,
    }),
  );
  return (
    <div
      {...scopedRoot(props.xstyle, styles.blockRoot)}
      data-language={highlighted().lang}
      innerHTML={highlighted().preHtml}
    />
  );
}

export interface CodePanelOptions extends SimpleCodeBlockProps {
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /** Lines above which a collapsible panel starts collapsed. */
  collapseAtLines?: number;
}

interface CodePanelState {
  highlighted: () => CodeHighlightResult;
  expanded: () => boolean;
  setExpanded: (next: boolean) => void;
  collapsible: () => boolean;
  copy: () => void;
  copied: () => boolean;
  path?: string;
  title?: string;
  lang?: string;
}

const CodePanelContext = createContext<CodePanelState | undefined>(undefined);

function usePanelState(): CodePanelState {
  const state = useContext(CodePanelContext);
  if (!state) throw new Error("CodePanel pieces must be used inside CodePanelRoot.");
  return state;
}

function useOptionalPanelState(): CodePanelState | undefined {
  return useContext(CodePanelContext);
}

/** Holds the highlighted HTML, copy state, and expand state for the pieces. */
export function CodePanelRoot(props: ParentProps<CodePanelOptions>) {
  const merged = mergeProps(
    { collapsible: true, collapseAtLines: COLLAPSE_AT_LINES, defaultExpanded: false },
    props,
  );
  const highlighted = createMemo(() =>
    highlightCodeBlock({
      code: merged.code,
      decorations: merged.decorations,
      lang: merged.lang,
      lineNumbers: merged.lineNumbers,
      meta: merged.meta,
      path: merged.path,
      title: merged.title,
    }),
  );
  const [expanded, setExpanded] = createSignal(merged.defaultExpanded);
  const collapseAtLines = createMemo(() => merged.collapseAtLines ?? COLLAPSE_AT_LINES);
  const collapsible = createMemo(
    () => merged.collapsible && highlighted().lineCount > collapseAtLines(),
  );
  const { copied, copy } = useCopyText(() => highlighted().copyText);

  const state: CodePanelState = {
    highlighted,
    expanded,
    setExpanded,
    collapsible,
    copy,
    copied,
    get path() {
      return merged.path;
    },
    get title() {
      return merged.title;
    },
    get lang() {
      return merged.lang;
    },
  };

  return (
    <CodePanelContext value={state}>
      <div {...scopedRoot(merged.xstyle)} data-language={highlighted().lang}>
        {merged.children}
      </div>
    </CodePanelContext>
  );
}

/** Bar with the file label on the left and actions on the right. */
export function CodePanelHeader(props: ParentProps<StyleProps>) {
  return <div {...stylex.attrs(styles.header, props.xstyle)}>{props.children}</div>;
}

export function CodePanelTitle(
  props: { path?: string; title?: string; lang?: string } & StyleProps,
) {
  const panel = useOptionalPanelState();
  const highlighted = createMemo(
    () =>
      panel?.highlighted() ??
      highlightCodeBlock({
        code: "",
        lang: props.lang,
        path: props.path,
        title: props.title,
      }),
  );
  const path = createMemo(() => props.path ?? panel?.path);
  const label = createMemo(() => {
    if (path()) return path();
    const metaTitle = props.title ?? panel?.title ?? highlighted().title;
    if (metaTitle) return metaTitle;
    return displayNameForLanguage(props.lang ?? panel?.lang ?? highlighted().lang);
  });
  const lang = createMemo(() => props.lang ?? panel?.lang ?? path() ?? highlighted().lang);
  return (
    <div {...stylex.attrs(styles.titleGroup, props.xstyle)}>
      <LanguageIcon lang={lang() ?? "tsx"} />
      <span {...stylex.attrs(styles.title)} title={label()}>
        {label()}
      </span>
    </div>
  );
}

/** Right side of the header. Provides tooltip timing for action buttons. */
export function CodePanelActions(props: ParentProps<StyleProps>) {
  return (
    <div {...stylex.attrs(styles.actions, props.xstyle)}>
      <Tooltip.Provider delay={400}>{props.children}</Tooltip.Provider>
    </div>
  );
}

export function CodePanelCopyButton() {
  const panel = usePanelState();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        aria-label={panel.copied() ? "Copied to clipboard" : "Copy code"}
        onClick={panel.copy}
        size="icon-sm"
        variant="ghost"
      >
        <Show when={panel.copied()} fallback={<CopyIcon {...stylex.attrs(styles.actionIcon)} />}>
          <CheckIcon {...stylex.attrs(styles.actionIcon)} />
        </Show>
      </Tooltip.Trigger>
      <Tooltip.Content>{panel.copied() ? "Copied" : "Copy code"}</Tooltip.Content>
    </Tooltip.Root>
  );
}

export function CodePanelCode(props: StyleProps) {
  const panel = usePanelState();
  return (
    <div
      {...stylex.attrs(styles.scrollContent, props.xstyle)}
      innerHTML={panel.highlighted().preHtml}
    />
  );
}

/** The one expand control. Floating pill, toggling both directions. */
export function CodePanelExpandButton() {
  const panel = usePanelState();
  return (
    <Show when={panel.collapsible()}>
      <Button
        onClick={() => panel.setExpanded(!panel.expanded())}
        aria-expanded={panel.expanded() ? "true" : "false"}
        size="sm"
        variant="secondary"
        xstyle={styles.expandButton}
      >
        {panel.expanded() ? "Collapse" : "Expand"}
        <ChevronDownIcon
          {...stylex.attrs(styles.expandIcon, panel.expanded() && styles.expandIconOpen)}
        />
      </Button>
    </Show>
  );
}

export function CodePanelBody(props: ParentProps<StyleProps>) {
  const panel = usePanelState();
  const collapsed = createMemo(() => panel.collapsible() && !panel.expanded());
  return (
    <div {...stylex.attrs(styles.body, collapsed() && styles.bodyCollapsed, props.xstyle)}>
      <ScrollArea.Root>
        <ScrollArea.Viewport xstyle={styles.scrollViewport}>
          <ScrollArea.Content
            xstyle={[
              styles.scrollContent,
              panel.expanded() && panel.collapsible() && styles.scrollContentPadded,
            ]}
          >
            {props.children ?? <CodePanelCode />}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" xstyle={styles.scrollTrack}>
          <ScrollArea.Thumb xstyle={styles.scrollThumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      <Show when={collapsed()}>
        <div aria-hidden="true" {...stylex.attrs(styles.fadeOverlay)} />
      </Show>
      <Show when={panel.collapsible()}>
        <div {...stylex.attrs(styles.expandFloat)}>
          <CodePanelExpandButton />
        </div>
      </Show>
    </div>
  );
}

export interface CodePanelProps extends ParentProps<CodePanelOptions> {
  /**
   * Backwards-compatible alias for `lang`. Old call sites passed display
   * labels like "TS"; they resolve through the highlighter either way.
   */
  language?: string;
}

/** Header plus collapsible body, the arrangement most docs pages want. */
export function CodePanel(props: CodePanelProps) {
  const merged = mergeProps(
    { collapsible: true, collapseAtLines: COLLAPSE_AT_LINES, defaultExpanded: false },
    props,
  );
  return (
    <CodePanelRoot
      code={merged.code}
      collapsible={merged.collapsible}
      collapseAtLines={merged.collapseAtLines}
      decorations={merged.decorations}
      defaultExpanded={merged.defaultExpanded}
      lang={merged.lang ?? merged.language}
      lineNumbers={merged.lineNumbers}
      meta={merged.meta}
      path={merged.path}
      title={merged.title}
      xstyle={merged.xstyle}
    >
      <CodePanelHeader>
        <CodePanelTitle />
        <CodePanelActions>
          <CodePanelCopyButton />
        </CodePanelActions>
      </CodePanelHeader>
      <CodePanelBody>{merged.children}</CodePanelBody>
    </CodePanelRoot>
  );
}

/** Backwards-compatible props for the previous default export. */
export type CodeBlockProps = CodePanelProps;

export default CodePanel;
