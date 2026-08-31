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
  path: {
    color: tokens.textMuted,
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
  },
});

export default function PrimitivesPage() {
  return (
    <Page
      eyebrow="Package reference"
      title="Primitives"
      meta={<Badge mono>rigid-ui/primitives</Badge>}
      lede="Behavior with no visual opinion. Each primitive is a separate subpath import, so you only pull in what you use."
    >
      <div {...stylex.attrs(styles.list)}>
        <For each={primitives}>
          {(primitive) => (
            <Link href={`/primitives/${primitive.slug}`} xstyle={styles.row}>
              <span {...stylex.attrs(styles.name)}>{primitive.name}</span>
              <span {...stylex.attrs(styles.path)}>{primitive.importPath}</span>
              <Badge mono>{`${primitive.anatomy.length} parts`}</Badge>
            </Link>
          )}
        </For>
      </div>
    </Page>
  );
}
