import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import Link from "../components/Link";
import Page from "../components/Page";
import { Badge } from "../components/ui/Badge";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  list: {
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    backgroundColor: {
      default: tokens.surface,
      ":hover": tokens.surfaceInteractive,
    },
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 44rem)": "11rem 1fr auto",
    },
    paddingBlock: "0.8rem",
    paddingInline: "0.9rem",
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    ":first-of-type": { borderTopWidth: 0 },
  },
  name: { fontSize: "0.875rem", fontWeight: 600 },
  copy: { color: tokens.textMuted, fontSize: "0.8125rem", lineHeight: 1.5 },
});

export default function ComponentsPage() {
  return (
    <Page
      title="Components"
      meta={<Badge mono>{`${primitives.length} entries`}</Badge>}
      lede="Opinionated StyleX source composed over the primitives. Every example ships the source that produced it; copy it and change the tokens."
    >
      <div {...stylex.attrs(styles.list)}>
        <For each={primitives}>
          {(component) => (
            <Link href={`/components/${component.slug}`} xstyle={styles.row}>
              <span {...stylex.attrs(styles.name)}>{component.name}</span>
              <span {...stylex.attrs(styles.copy)}>{component.description}</span>
              <Badge mono>{`${component.anatomy.length} parts`}</Badge>
            </Link>
          )}
        </For>
      </div>
    </Page>
  );
}
