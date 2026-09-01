import * as stylex from "@stylexjs/stylex";

import Band, { BandHeader, frame } from "../components/Frame";
import CodeBlock from "../components/CodeBlock";
import Example from "../components/Example";
import Page from "../components/Page";
import { componentSources } from "../content/componentSources";
import BasicTooltip from "../examples/tooltip/BasicTooltip";
import basicSrc from "../examples/tooltip/BasicTooltip.tsx?raw";
import { Badge } from "../components/ui/Badge";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  sourceSection: { paddingBlock: "1.25rem" },
  copy: {
    color: tokens.textMuted,
    fontSize: "0.875rem",
    lineHeight: 1.65,
    margin: "0 0 0.9rem",
    maxWidth: "46rem",
  },
});
export default function TooltipPage() {
  return (
    <Page
      title="Tooltip"
      meta={<Badge mono>components/ui/Tooltip.tsx</Badge>}
      lede="A short label or description that appears after a pointer rests on its trigger, or immediately on keyboard focus."
    >
      <Example
        title="Grouped tooltips"
        note="The provider shares timing. Once one tooltip is visible, adjacent tooltips open without another delay."
        src={basicSrc}
      >
        <BasicTooltip />
      </Example>
      <Band bare>
        <BandHeader title="Source" note="components/ui/Tooltip.tsx" />
        <div {...stylex.attrs(frame.inset, styles.sourceSection)}>
          <p {...stylex.attrs(styles.copy)}>Copy and paste the following code into your project.</p>
          <CodeBlock path="components/ui/Tooltip.tsx" code={componentSources.tooltip} />
        </div>
      </Band>
    </Page>
  );
}
