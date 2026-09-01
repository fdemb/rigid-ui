import * as stylex from "@stylexjs/stylex";
import type { JSX } from "@solidjs/web";

import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  root: {
    maxWidth: "68rem",
    paddingBlock: "clamp(2.5rem, 7vw, 5.5rem) 7rem",
    paddingInline: "clamp(1rem, 5vw, 5rem)",
  },
  headline: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    marginBlockStart: 0,
  },
  title: {
    fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
    fontWeight: 680,
    letterSpacing: "-0.03em",
    lineHeight: 1.02,
    margin: 0,
  },
  lede: {
    color: tokens.textMuted,
    fontSize: "1rem",
    lineHeight: 1.7,
    marginBlock: "1rem 0 0",
    maxWidth: "42rem",
  },
  rule: {
    backgroundColor: tokens.border,
    height: 1,
    marginBlock: "2.5rem",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
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
