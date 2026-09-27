import * as stylex from "@stylexjs/stylex";
import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import { frame } from "./Frame";
import { CodeBlock } from "./CodeBlock";
import { colors, motion, radii, typography } from "./ui/tokens.stylex";
import { siteLayout } from "../styles/site.stylex";

const styles = stylex.create({
  root: {
    borderColor: colors.border,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
    marginBlock: "1.5rem",
  },
  note: {
    borderBottomColor: colors.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: colors.mutedForeground,
    fontSize: "0.8125rem",
    lineHeight: 1.55,
    margin: 0,
    paddingBlock: "0.7rem",
  },
  preview: {
    alignItems: "center",
    backgroundColor: colors.background,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "center",
    minHeight: "18rem",
    paddingBlock: "clamp(2rem, 6vw, 3.5rem)",
    paddingInline: siteLayout.inset,
  },
  summary: {
    borderTopColor: colors.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    cursor: "pointer",
    fontFamily: typography.mono,
    fontSize: "0.75rem",
    paddingBlock: "0.6rem",
    transition: `color ${motion.fast} ${motion.easing}`,
    userSelect: "none",
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
  source: {
    borderTopColor: colors.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
  },
  sourceBlock: {
    borderRadius: 0,
    borderWidth: 0,
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
        <div {...stylex.attrs(styles.source)}>
          <CodeBlock code={props.src} lang="tsx" xstyle={styles.sourceBlock} />
        </div>
      </details>
    </section>
  );
}
