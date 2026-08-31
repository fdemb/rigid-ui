import * as stylex from "@stylexjs/stylex";
import type { JSX } from "@solidjs/web";

import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  root: {
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    paddingBlock: "2.5rem 6rem",
    paddingInline: "clamp(1.25rem, 4vw, 2rem)",
  },
  headline: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    marginBlockStart: "0.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 650,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    margin: 0,
  },
  lede: {
    color: tokens.textMuted,
    fontSize: "0.9375rem",
    lineHeight: 1.6,
    marginBlock: "0.6rem 0",
    maxWidth: "46rem",
  },
  rule: {
    backgroundColor: tokens.border,
    height: 1,
    marginBlock: "1.75rem",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
});

export default function Page(props: {
  title: string;
  lede: string;
  /** Badges or controls that sit on the title's baseline. */
  meta?: JSX.Element;
  children: JSX.Element;
}) {
  return (
    <div {...stylex.attrs(styles.root)}>
      <div {...stylex.attrs(styles.headline)}>
        <h1 {...stylex.attrs(styles.title)}>{props.title}</h1>
        {props.meta}
      </div>
      <p {...stylex.attrs(styles.lede)}>{props.lede}</p>
      <div aria-hidden="true" {...stylex.attrs(styles.rule)} />
      <div {...stylex.attrs(styles.content)}>{props.children}</div>
    </div>
  );
}
