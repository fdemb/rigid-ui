import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import Page from "../components/Page";
import { Matrix, Row, VariantMatrix, variantAxes } from "../components/VariantMatrix";
import DeploymentBlock from "../blocks/DeploymentBlock";
import FeedbackBlock from "../blocks/FeedbackBlock";
import SignInBlock from "../blocks/SignInBlock";
import UsageBlock from "../blocks/UsageBlock";
import { components } from "../content/components";

const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "1rem" },
  blocks: {
    alignItems: "start",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 52rem)": "repeat(2, minmax(0, 1fr))",
    },
  },
});

/** Catalog order, minus the primitive-backed components, which have no matrix. */
const styled = components.filter((entry) => variantAxes[entry.slug]);

export default function ElementsPage() {
  return (
    <Page
      title="Elements"
      lede="The styled layer the registry components are built from. Each one is plain StyleX over the token set, so switching themes moves all of them at once."
    >
      <div {...stylex.attrs(styles.page)}>
        <For each={styled}>
          {(entry) => (
            <Matrix name={entry.name} note={variantAxes[entry.slug]}>
              <VariantMatrix slug={entry.slug} />
            </Matrix>
          )}
        </For>
        <Matrix name="Blocks" note="elements composed with primitives">
          <Row label="composed">
            <div {...stylex.attrs(styles.blocks)}>
              <SignInBlock />
              <DeploymentBlock />
              <FeedbackBlock />
              <UsageBlock />
            </div>
          </Row>
        </Matrix>
      </div>
    </Page>
  );
}
