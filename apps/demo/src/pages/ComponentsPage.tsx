import * as stylex from "@stylexjs/stylex";
import { For, Show } from "solid-js";

import Band, { BandHeader } from "../components/Frame";
import Link from "../components/Link";
import Page from "../components/Page";
import { components } from "../content/components";
import { tokens } from "../styles/tokens.stylex";

const groups = (["Inputs", "Overlays", "Layout", "Feedback"] as const).map((name) => ({
  name,
  entries: components.filter((entry) => entry.group === name),
}));

const styles = stylex.create({
  intro: {
    color: tokens.textMuted,
    fontSize: "0.8125rem",
    lineHeight: 1.6,
    margin: 0,
    maxWidth: "38rem",
    paddingBlock: "1rem",
  },
  /*
   * The rules between cells are 1px gaps showing the container through, which
   * is the one grid technique that survives any item count: no cell has to know
   * whether it sits in the last row or the last column, and nothing doubles up
   * against the frame's rails. A half-empty final row would show the container
   * as a block, so `filler` closes it.
   */
  grid: {
    backgroundColor: tokens.border,
    display: "grid",
    gap: 1,
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 40rem)": "repeat(2, minmax(0, 1fr))",
    },
  },
  item: {
    backgroundColor: { default: tokens.canvas, ":hover": tokens.surfaceInteractive },
    display: "grid",
    gap: "0.3rem",
    paddingBlock: "1rem",
    paddingInline: tokens.inset,
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    "@media (prefers-reduced-motion: reduce)": { transitionProperty: "none" },
  },
  filler: {
    backgroundColor: tokens.canvas,
    display: { default: "none", "@media (min-width: 40rem)": "block" },
  },
  name: { fontSize: "0.9375rem", fontWeight: 620 },
  description: { color: tokens.textMuted, fontSize: "0.8125rem", lineHeight: 1.55 },
});

export default function ComponentsPage() {
  return (
    <Page
      title="Components"
      lede="Finished, editable recipes for application interfaces. Each component has a focused page with its states, source location, and the primitive it builds on when one is involved."
    >
      <Band>
        <p {...stylex.attrs(styles.intro)}>
          Vendorable recipes for application interfaces. Each page provides the complete component
          source and examples ready to copy into your project.
        </p>
      </Band>
      <For each={groups}>
        {(group) => (
          <Band bare>
            <BandHeader title={group.name} />
            <div {...stylex.attrs(styles.grid)}>
              <For each={group.entries}>
                {(entry) => (
                  <Link href={`/components/${entry.slug}`} xstyle={styles.item}>
                    <span {...stylex.attrs(styles.name)}>{entry.name}</span>
                    <span {...stylex.attrs(styles.description)}>{entry.description}</span>
                  </Link>
                )}
              </For>
              <Show when={group.entries.length % 2 === 1}>
                <div aria-hidden="true" {...stylex.attrs(styles.filler)} />
              </Show>
            </div>
          </Band>
        )}
      </For>
    </Page>
  );
}
