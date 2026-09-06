import * as stylex from "@stylexjs/stylex";
import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import { frame } from "./Frame";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  root: {
    borderColor: tokens.border,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens.radiusLg,
    overflow: "hidden",
    marginBlock: "1.5rem",
  },
  note: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: tokens.textMuted,
    fontSize: "0.8125rem",
    lineHeight: 1.55,
    margin: 0,
    paddingBlock: "0.7rem",
  },
  preview: {
    alignItems: "center",
    backgroundColor: tokens.canvas,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "center",
    minHeight: "18rem",
    paddingBlock: "clamp(2rem, 6vw, 3.5rem)",
    paddingInline: tokens.inset,
  },
  summary: {
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: { default: tokens.textMuted, ":hover": tokens.text },
    cursor: "pointer",
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    paddingBlock: "0.6rem",
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
    paddingBlock: "1rem",
    paddingInline: tokens.inset,
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
    <section aria-label={props.title} {...stylex.attrs(styles.root)}>
      <Show when={props.note}>
        <p {...stylex.attrs(frame.inset, styles.note)}>{props.note}</p>
      </Show>
      <div {...stylex.attrs(styles.preview)}>{props.children}</div>
      <details>
        <summary {...stylex.attrs(frame.inset, styles.summary)}>View code</summary>
        <pre {...stylex.attrs(styles.source)}>
          <code>{props.src}</code>
        </pre>
      </details>
    </section>
  );
}
