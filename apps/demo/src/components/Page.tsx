import * as stylex from "@stylexjs/stylex";
import type { JSX } from "@solidjs/web";

import Band from "./Frame";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  masthead: { paddingBlock: "clamp(2.25rem, 6vw, 4rem)" },
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
    marginBlock: "0.9rem 0",
    maxWidth: "42rem",
  },
});

/**
 * The documentation frame. The masthead is the page's first band and every
 * child is a band of its own, so the page reads as a stack of ruled regions
 * with no space between them.
 */
export default function Page(props: {
  title: string;
  lede: string;
  /** Badges or controls that sit on the title's baseline. */
  meta?: JSX.Element;
  children: JSX.Element;
}) {
  return (
    <>
      <Band xstyle={styles.masthead}>
        <div {...stylex.attrs(styles.headline)}>
          <h1 {...stylex.attrs(styles.title)}>{props.title}</h1>
          {props.meta}
        </div>
        <p {...stylex.attrs(styles.lede)}>{props.lede}</p>
      </Band>
      {props.children}
    </>
  );
}
