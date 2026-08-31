import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import Link from "../components/Link";
import { Badge } from "../components/ui/Badge";
import { buttonStyle } from "../components/ui/Button";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";

const packages = [
  {
    name: "rigid-ui",
    role: "Registry",
    body: "StyleX source for the designed layer. Copy a file into your app and edit it; nothing is hidden behind a theme prop.",
    href: "/components",
    action: "Browse components",
  },
  {
    name: "rigid-ui/primitives",
    role: "Dependency",
    body: "Behavior only. Focus management, dismissal, hover intent, and Floating UI positioning, imported from explicit subpaths.",
    href: "/primitives",
    action: "Read the reference",
  },
] as const;

const styles = stylex.create({
  root: {
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    paddingBlock: "3.5rem 6rem",
    paddingInline: "clamp(1.25rem, 4vw, 2rem)",
  },
  hero: { maxWidth: "44rem" },
  title: {
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
    fontWeight: 650,
    letterSpacing: "-0.035em",
    lineHeight: 1.1,
    marginBlock: "0.9rem 0",
  },
  lede: {
    color: tokens.textMuted,
    fontSize: "1rem",
    lineHeight: 1.65,
    marginBlock: "0.85rem 0",
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBlockStart: "1.5rem",
  },
  install: {
    backgroundColor: tokens.codeBackground,
    borderRadius: tokens.radiusMd,
    color: tokens.codeText,
    fontFamily: tokens.fontMono,
    fontSize: "0.8125rem",
    paddingBlock: "0.55rem",
    paddingInline: "0.75rem",
  },
  prompt: { color: tokens.textSubtle, userSelect: "none" },
  rule: { backgroundColor: tokens.border, height: 1, marginBlock: "3rem" },
  sectionLabel: {
    color: tokens.textSubtle,
    fontFamily: tokens.fontMono,
    fontSize: "0.6875rem",
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  split: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 48rem)": "repeat(2, minmax(0, 1fr))",
    },
    marginBlockStart: "1rem",
  },
  panel: {
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    padding: "1rem",
  },
  panelHead: { alignItems: "center", display: "flex", gap: "0.5rem" },
  panelName: { fontFamily: tokens.fontMono, fontSize: "0.8125rem", margin: 0 },
  panelBody: { color: tokens.textMuted, fontSize: "0.8125rem", lineHeight: 1.6, margin: 0 },
  panelLink: {
    color: tokens.accent,
    fontSize: "0.8125rem",
    fontWeight: 600,
    marginBlockStart: "auto",
    paddingBlockStart: "0.4rem",
    textDecoration: "none",
  },
  index: {
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    marginBlockStart: "1rem",
    overflow: "hidden",
  },
  indexRow: {
    alignItems: "center",
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: {
      default: tokens.text,
      ":hover": tokens.text,
    },
    backgroundColor: {
      default: tokens.surface,
      ":hover": tokens.surfaceInteractive,
    },
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 44rem)": "10rem 1fr 12rem",
    },
    paddingBlock: "0.7rem",
    paddingInline: "0.9rem",
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    ":first-of-type": { borderTopWidth: 0 },
  },
  indexName: { fontSize: "0.875rem", fontWeight: 600 },
  indexCopy: { color: tokens.textMuted, fontSize: "0.8125rem", lineHeight: 1.5 },
  indexPath: {
    color: tokens.textSubtle,
    fontFamily: tokens.fontMono,
    fontSize: "0.6875rem",
  },
});

export default function Home() {
  return (
    <div {...stylex.attrs(styles.root)}>
      <section {...stylex.attrs(styles.hero)}>
        <h1 {...stylex.attrs(styles.title)}>
          Component behavior for Solid, and a design layer you own.
        </h1>
        <p {...stylex.attrs(styles.lede)}>
          Rigid UI ships two things: tested, accessible primitives you install as a dependency, and
          StyleX-styled components you copy into your codebase and edit.
        </p>
        <div {...stylex.attrs(styles.actions)}>
          <code {...stylex.attrs(styles.install)}>
            <span {...stylex.attrs(styles.prompt)}>$ </span>npm i rigid-ui
          </code>
          <Link href="/elements" xstyle={buttonStyle({ size: "sm", variant: "secondary" })}>
            View elements
          </Link>
        </div>
      </section>

      <div aria-hidden="true" {...stylex.attrs(styles.rule)} />

      <section>
        <p {...stylex.attrs(styles.sectionLabel)}>Two packages</p>
        <div {...stylex.attrs(styles.split)}>
          <For each={packages}>
            {(entry) => (
              <div {...stylex.attrs(styles.panel)}>
                <div {...stylex.attrs(styles.panelHead)}>
                  <h2 {...stylex.attrs(styles.panelName)}>{entry.name}</h2>
                  <Badge>{entry.role}</Badge>
                </div>
                <p {...stylex.attrs(styles.panelBody)}>{entry.body}</p>
                <Link href={entry.href} xstyle={styles.panelLink}>
                  {entry.action}
                </Link>
              </div>
            )}
          </For>
        </div>
      </section>

      <div aria-hidden="true" {...stylex.attrs(styles.rule)} />

      <section>
        <p {...stylex.attrs(styles.sectionLabel)}>Components</p>
        <div {...stylex.attrs(styles.index)}>
          <For each={primitives}>
            {(entry) => (
              <Link href={`/components/${entry.slug}`} xstyle={styles.indexRow}>
                <span {...stylex.attrs(styles.indexName)}>{entry.name}</span>
                <span {...stylex.attrs(styles.indexCopy)}>{entry.description}</span>
                <span {...stylex.attrs(styles.indexPath)}>{entry.importPath}</span>
              </Link>
            )}
          </For>
        </div>
      </section>
    </div>
  );
}
