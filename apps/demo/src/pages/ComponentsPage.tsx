import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import Link from "../components/Link";
import Page from "../components/Page";
import { components } from "../content/components";
import { tokens } from "../styles/tokens.stylex";

const groups = ["Inputs", "Overlays", "Layout", "Feedback"] as const;

const styles = stylex.create({
  intro: {
    backgroundColor: tokens.surfaceSunken,
    borderRadius: tokens.radiusLg,
    padding: "1rem",
  },
  introCopy: {
    color: tokens.textMuted,
    fontSize: "0.8125rem",
    lineHeight: 1.6,
    margin: 0,
    maxWidth: "38rem",
  },
  group: { display: "grid", gap: "0.8rem" },
  groupTitle: { fontSize: "0.8125rem", fontWeight: 650, margin: 0 },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 40rem)": "repeat(2, minmax(0, 1fr))",
    },
  },
  item: {
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "grid",
    gap: "0.35rem",
    paddingBlock: "1rem",
    paddingInline: "0.2rem 1.5rem",
    textDecoration: "none",
    "@media (min-width: 40rem)": { ":nth-child(even)": { paddingInline: "1.5rem 0.2rem" } },
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
      <div {...stylex.attrs(styles.intro)}>
        <p {...stylex.attrs(styles.introCopy)}>
          The registry is planned. For now, these pages document the source that lives in this demo
          rather than presenting an install command that does not exist yet.
        </p>
      </div>
      <For each={groups}>
        {(group) => (
          <section {...stylex.attrs(styles.group)}>
            <h2 {...stylex.attrs(styles.groupTitle)}>{group}</h2>
            <div {...stylex.attrs(styles.grid)}>
              <For each={components.filter((entry) => entry.group === group)}>
                {(entry) => (
                  <Link href={`/components/${entry.slug}`} xstyle={styles.item}>
                    <span {...stylex.attrs(styles.name)}>{entry.name}</span>
                    <span {...stylex.attrs(styles.description)}>{entry.description}</span>
                  </Link>
                )}
              </For>
            </div>
          </section>
        )}
      </For>
    </Page>
  );
}
