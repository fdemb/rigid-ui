import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import Link from "../components/Link";
import Page from "../components/Page";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  list: { borderTopColor: tokens.border, borderTopStyle: "solid", borderTopWidth: 1 },
  row: {
    alignItems: "center",
    backgroundColor: { default: "transparent", ":hover": tokens.surfaceInteractive },
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 44rem)": "11rem 1fr",
    },
    paddingBlock: "1rem",
    paddingInline: "0.65rem",
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    ":first-of-type": { borderTopWidth: 0 },
  },
  name: { fontSize: "0.875rem", fontWeight: 600 },
  path: {
    color: tokens.textMuted,
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
  },
});

export default function PrimitivesPage() {
  return (
    <Page
      title="Primitives"
      lede="Unstyled behavior, focus management, and positioning. Primitive pages document anatomy and package imports without prescribing how the result should look."
    >
      <div {...stylex.attrs(styles.list)}>
        <For each={primitives}>
          {(primitive) => (
            <Link href={`/primitives/${primitive.slug}`} xstyle={styles.row}>
              <span {...stylex.attrs(styles.name)}>{primitive.name}</span>
              <span {...stylex.attrs(styles.path)}>{primitive.importPath}</span>
            </Link>
          )}
        </For>
      </div>
    </Page>
  );
}
