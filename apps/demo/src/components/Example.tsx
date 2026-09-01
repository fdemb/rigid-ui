import * as stylex from "@stylexjs/stylex";
import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  root: {
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderRadius: tokens.radiusXl,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
    paddingBlock: "0.75rem",
    paddingInline: "1rem",
  },
  title: {
    fontSize: "0.8125rem",
    fontWeight: 620,
    letterSpacing: "-0.01em",
    margin: 0,
  },
  note: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: tokens.textMuted,
    fontSize: "0.8125rem",
    lineHeight: 1.55,
    margin: 0,
    paddingBlock: "0.6rem",
    paddingInline: "0.85rem",
  },
  preview: {
    alignItems: "center",
    backgroundColor: tokens.canvas,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "center",
    minHeight: "18rem",
    padding: "clamp(1.5rem, 6vw, 3.5rem)",
  },
  summary: {
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: {
      default: tokens.textMuted,
      ":hover": tokens.text,
    },
    cursor: "pointer",
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    paddingBlock: "0.55rem",
    paddingInline: "0.85rem",
    transition: `color ${tokens.durationFast} ${tokens.easing}`,
    userSelect: "none",
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
  source: {
    backgroundColor: tokens.codeBackground,
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: tokens.codeText,
    fontSize: "0.75rem",
    lineHeight: 1.65,
    margin: 0,
    overflowX: "auto",
    padding: "1rem",
  },
});

interface ExampleProps {
  title: string;
  note?: string;
  src: string;
  children: JSX.Element;
}

export default function Example(props: ExampleProps) {
  return (
    <section {...stylex.attrs(styles.root)}>
      <div {...stylex.attrs(styles.header)}>
        <h2 {...stylex.attrs(styles.title)}>{props.title}</h2>
      </div>
      <Show when={props.note}>
        <p {...stylex.attrs(styles.note)}>{props.note}</p>
      </Show>
      <div {...stylex.attrs(styles.preview)}>{props.children}</div>
      <details>
        <summary {...stylex.attrs(styles.summary)}>Source</summary>
        <pre {...stylex.attrs(styles.source)}>
          <code>{props.src}</code>
        </pre>
      </details>
    </section>
  );
}
