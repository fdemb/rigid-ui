import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import { Bleed, frame } from "../components/Frame";
import Link from "../components/Link";
import { buttonStyle } from "../components/ui/Button";
import { components } from "../content/components";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  hero: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 58rem)": "minmax(0, 1.25fr) minmax(20rem, 0.75fr)",
    },
  },
  /*
   * Both hero cells carry the same block padding on both edges, so the band
   * sits evenly between the header's rule and the import strip's. The cells
   * bottom-align, which is what keeps the lede on the title's last baseline
   * without either of them needing an uneven edge.
   */
  heroCell: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBlock: { default: "3rem", "@media (min-width: 58rem)": "clamp(3.5rem, 7vw, 5.5rem)" },
  },
  heroLead: {
    // At one column the rule between the cells is horizontal instead.
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: { default: 1, "@media (min-width: 58rem)": 0 },
    borderInlineEndColor: tokens.border,
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: { default: 0, "@media (min-width: 58rem)": 1 },
  },
  title: {
    fontSize: "clamp(2.5rem, 6vw, 4.75rem)",
    fontWeight: 690,
    letterSpacing: "-0.035em",
    lineHeight: 0.95,
    margin: 0,
    maxWidth: "11ch",
    textWrap: "balance",
  },
  heroSide: { gap: "1.5rem" },
  lede: { color: tokens.textMuted, fontSize: "1rem", lineHeight: 1.65, margin: 0 },
  actions: { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "0.55rem" },
  primaryCta: {
    backgroundColor: { default: tokens.text, ":hover": tokens.textMuted },
    borderColor: tokens.text,
    color: tokens.canvas,
  },
  importStrip: {
    alignItems: "baseline",
    backgroundColor: tokens.codeBackground,
    color: tokens.codeText,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem 2rem",
    justifyContent: "space-between",
    paddingBlock: "1.1rem",
    paddingInline: tokens.inset,
  },
  importLine: { fontFamily: tokens.fontMono, fontSize: "0.8125rem", overflowX: "auto" },
  importNote: { color: tokens.codeTextMuted, fontSize: "0.75rem" },
  split: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 48rem)": "repeat(2, minmax(0, 1fr))",
    },
  },
  lane: {
    display: "flex",
    flexDirection: "column",
    paddingBlock: "clamp(2rem, 4vw, 3rem) 0",
    ":first-child": {
      borderBottomColor: tokens.border,
      borderBottomStyle: "solid",
      borderBottomWidth: { default: 1, "@media (min-width: 48rem)": 0 },
      borderInlineEndColor: tokens.border,
      borderInlineEndStyle: "solid",
      borderInlineEndWidth: { default: 0, "@media (min-width: 48rem)": 1 },
    },
  },
  laneHead: { paddingInline: tokens.inset },
  laneTitle: {
    fontSize: "clamp(1.5rem, 3vw, 2.15rem)",
    fontWeight: 650,
    letterSpacing: "-0.03em",
    margin: 0,
  },
  laneCopy: {
    color: tokens.textMuted,
    fontSize: "0.875rem",
    lineHeight: 1.65,
    marginBlock: "0.7rem 1.75rem",
    maxWidth: "32rem",
  },
  sampleRow: {
    alignItems: "center",
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: { default: tokens.text, ":hover": tokens.text },
    display: "flex",
    fontSize: "0.8125rem",
    gap: "1rem",
    justifyContent: "space-between",
    paddingBlock: "0.7rem",
    paddingInline: tokens.inset,
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    ":hover": { backgroundColor: tokens.surfaceInteractive },
    "@media (prefers-reduced-motion: reduce)": { transitionProperty: "none" },
  },
  sampleMeta: { color: tokens.textSubtle, fontFamily: tokens.fontMono, fontSize: "0.6875rem" },
  laneLink: {
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: tokens.text,
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 620,
    marginBlockStart: "auto",
    paddingBlock: "0.85rem",
    paddingInline: tokens.inset,
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    ":hover": { backgroundColor: tokens.surfaceInteractive },
    "@media (prefers-reduced-motion: reduce)": { transitionProperty: "none" },
  },
});

export default function Home() {
  return (
    <>
      <Bleed bare xstyle={styles.hero}>
        <div {...stylex.attrs(frame.inset, styles.heroCell, styles.heroLead)}>
          <h1 {...stylex.attrs(styles.title)}>Solid parts. Your interface.</h1>
        </div>
        <div {...stylex.attrs(frame.inset, styles.heroCell, styles.heroSide)}>
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
      </Bleed>

      <Bleed bare xstyle={styles.importStrip}>
        <code {...stylex.attrs(styles.importLine)}>
          import &#123; Popover &#125; from &quot;rigid-ui/primitives/popover&quot;;
        </code>
        <span {...stylex.attrs(styles.importNote)}>Every primitive ships on its own subpath.</span>
      </Bleed>

      <Bleed aria-label="Catalogs" bare xstyle={styles.split}>
        <div {...stylex.attrs(styles.lane)}>
          <div {...stylex.attrs(styles.laneHead)}>
            <h2 {...stylex.attrs(styles.laneTitle)}>Components</h2>
            <p {...stylex.attrs(styles.laneCopy)}>
              Finished controls and patterns for product interfaces. The registry is planned; today,
              every page points to the source used by this demo.
            </p>
          </div>
          <For each={components.slice(0, 5)}>
            {(entry) => (
              <Link href={`/components/${entry.slug}`} xstyle={styles.sampleRow}>
                <span>{entry.name}</span>
                <span {...stylex.attrs(styles.sampleMeta)}>{entry.group}</span>
              </Link>
            )}
          </For>
          <Link href="/components" xstyle={styles.laneLink}>
            View all {components.length} components
          </Link>
        </div>
        <div {...stylex.attrs(styles.lane)}>
          <div {...stylex.attrs(styles.laneHead)}>
            <h2 {...stylex.attrs(styles.laneTitle)}>Primitives</h2>
            <p {...stylex.attrs(styles.laneCopy)}>
              Unstyled behavior for focus, dismissal, hover intent, scrolling, and anchored
              positioning. Import each primitive from its own subpath.
            </p>
          </div>
          <For each={primitives}>
            {(entry) => (
              <Link href={`/primitives/${entry.slug}`} xstyle={styles.sampleRow}>
                <span>{entry.name}</span>
                <span {...stylex.attrs(styles.sampleMeta)}>{entry.importPath}</span>
              </Link>
            )}
          </For>
          <Link href="/primitives" xstyle={styles.laneLink}>
            View all {primitives.length} primitives
          </Link>
        </div>
      </Bleed>
    </>
  );
}
