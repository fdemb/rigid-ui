import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import Link from "../components/Link";
import { buttonStyle } from "../components/ui/Button";
import { components } from "../content/components";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  root: {
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    paddingInline: "clamp(1rem, 3vw, 2rem)",
  },
  hero: {
    alignItems: "end",
    display: "grid",
    gap: "3rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 58rem)": "minmax(0, 1.3fr) minmax(18rem, 0.7fr)",
    },
    paddingBlock: "clamp(4.5rem, 11vw, 9rem)",
  },
  title: {
    fontSize: "clamp(2.5rem, 6vw, 4.75rem)",
    fontWeight: 690,
    letterSpacing: "-0.04em",
    lineHeight: 0.94,
    margin: 0,
    maxWidth: "11ch",
  },
  heroSide: { display: "grid", gap: "1.4rem", paddingBlockEnd: "0.45rem" },
  lede: {
    color: tokens.textMuted,
    fontSize: "1rem",
    lineHeight: 1.65,
    margin: 0,
    maxWidth: "34rem",
  },
  actions: { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "0.55rem" },
  primaryCta: {
    backgroundColor: { default: tokens.text, ":hover": tokens.textMuted },
    borderColor: tokens.text,
    color: tokens.canvas,
  },
  split: {
    borderBlockColor: tokens.border,
    borderBlockStyle: "solid",
    borderBlockWidth: 1,
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 48rem)": "repeat(2, minmax(0, 1fr))",
    },
  },
  lane: {
    display: "flex",
    flexDirection: "column",
    minHeight: "25rem",
    paddingBlock: "clamp(2rem, 5vw, 4rem)",
    paddingInline: { default: 0, "@media (min-width: 48rem)": "clamp(2rem, 5vw, 4rem)" },
    ":first-child": {
      borderBottomColor: tokens.border,
      borderBottomStyle: "solid",
      borderBottomWidth: { default: 1, "@media (min-width: 48rem)": 0 },
      borderRightColor: tokens.border,
      borderRightStyle: "solid",
      borderRightWidth: { default: 0, "@media (min-width: 48rem)": 1 },
      paddingInlineStart: 0,
    },
  },
  laneTitle: {
    fontSize: "clamp(1.5rem, 3vw, 2.15rem)",
    fontWeight: 650,
    letterSpacing: "-0.035em",
    margin: 0,
  },
  laneCopy: {
    color: tokens.textMuted,
    fontSize: "0.9rem",
    lineHeight: 1.65,
    marginBlock: "0.8rem 2rem",
    maxWidth: "34rem",
  },
  sample: {
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "grid",
    marginBlockEnd: "2rem",
  },
  sampleRow: {
    alignItems: "center",
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    fontSize: "0.8125rem",
    justifyContent: "space-between",
    paddingBlock: "0.7rem",
  },
  sampleMeta: { color: tokens.textSubtle, fontFamily: tokens.fontMono, fontSize: "0.6875rem" },
  laneLink: {
    alignSelf: "start",
    color: tokens.text,
    fontSize: "0.8125rem",
    fontWeight: 620,
    marginBlockStart: "auto",
    textDecorationColor: tokens.borderStrong,
  },
  footer: { color: tokens.textSubtle, fontSize: "0.75rem", paddingBlock: "2rem 4rem" },
});

export default function Home() {
  return (
    <div {...stylex.attrs(styles.root)}>
      <section {...stylex.attrs(styles.hero)}>
        <h1 {...stylex.attrs(styles.title)}>Solid parts. Your interface.</h1>
        <div {...stylex.attrs(styles.heroSide)}>
          <p {...stylex.attrs(styles.lede)}>
            Rigid UI separates accessible behavior from finished design. Use the primitives as a
            package, or start with styled recipes you can vendor and change.
          </p>
          <div {...stylex.attrs(styles.actions)}>
            <Link
              href="/components"
              xstyle={[buttonStyle({ size: "md", variant: "primary" }), styles.primaryCta]}
            >
              Browse components
            </Link>
            <Link href="/primitives" xstyle={buttonStyle({ size: "md", variant: "outline" })}>
              Read primitive docs
            </Link>
          </div>
        </div>
      </section>
      <section aria-label="Catalogs" {...stylex.attrs(styles.split)}>
        <div {...stylex.attrs(styles.lane)}>
          <h2 {...stylex.attrs(styles.laneTitle)}>Components</h2>
          <p {...stylex.attrs(styles.laneCopy)}>
            Finished controls and patterns for product interfaces. The registry is planned; today,
            every page points to the source used by this demo.
          </p>
          <div {...stylex.attrs(styles.sample)}>
            <For each={components.slice(0, 4)}>
              {(entry) => (
                <div {...stylex.attrs(styles.sampleRow)}>
                  <span>{entry.name}</span>
                  <span {...stylex.attrs(styles.sampleMeta)}>{entry.group}</span>
                </div>
              )}
            </For>
          </div>
          <Link href="/components" xstyle={styles.laneLink}>
            View all {components.length} components
          </Link>
        </div>
        <div {...stylex.attrs(styles.lane)}>
          <h2 {...stylex.attrs(styles.laneTitle)}>Primitives</h2>
          <p {...stylex.attrs(styles.laneCopy)}>
            Unstyled behavior for focus, dismissal, hover intent, scrolling, and anchored
            positioning. Import each primitive from its own subpath.
          </p>
          <div {...stylex.attrs(styles.sample)}>
            <For each={primitives.slice(0, 4)}>
              {(entry) => (
                <div {...stylex.attrs(styles.sampleRow)}>
                  <span>{entry.name}</span>
                  <span {...stylex.attrs(styles.sampleMeta)}>{entry.importPath}</span>
                </div>
              )}
            </For>
          </div>
          <Link href="/primitives" xstyle={styles.laneLink}>
            View all {primitives.length} primitives
          </Link>
        </div>
      </section>
      <footer {...stylex.attrs(styles.footer)}>Built for the Solid 2 release candidate.</footer>
    </div>
  );
}
