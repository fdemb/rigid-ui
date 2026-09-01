import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import Band from "../components/Frame";
import Link from "../components/Link";
import Page from "../components/Page";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  row: {
    alignItems: "baseline",
    display: "grid",
    gap: "0.25rem 1.5rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 44rem)": "11rem 1fr auto",
    },
    paddingBlock: "1.1rem",
    paddingInline: tokens.inset,
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    ":hover": { backgroundColor: tokens.surfaceInteractive },
    ":not(:last-child)": {
      borderBottomColor: tokens.border,
      borderBottomStyle: "solid",
      borderBottomWidth: 1,
    },
    "@media (prefers-reduced-motion: reduce)": { transitionProperty: "none" },
  },
  name: { fontSize: "0.9375rem", fontWeight: 620 },
  description: { color: tokens.textMuted, fontSize: "0.8125rem", lineHeight: 1.55 },
  path: { color: tokens.textSubtle, fontFamily: tokens.fontMono, fontSize: "0.6875rem" },
});

export default function PrimitivesPage() {
  return (
    <Page
      title="Primitives"
      lede="Unstyled behavior, focus management, and positioning. Primitive pages document anatomy and package imports without prescribing how the result should look."
    >
      <Band bare>
        <For each={primitives}>
          {(primitive) => (
            <Link href={`/primitives/${primitive.slug}`} xstyle={styles.row}>
              <span {...stylex.attrs(styles.name)}>{primitive.name}</span>
              <span {...stylex.attrs(styles.description)}>{primitive.description}</span>
              <span {...stylex.attrs(styles.path)}>{primitive.importPath}</span>
            </Link>
          )}
        </For>
      </Band>
    </Page>
  );
}
