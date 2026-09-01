import * as stylex from "@stylexjs/stylex";

import Band, { BandHeader, frame } from "../components/Frame";
import CodeBlock from "../components/CodeBlock";
import Example from "../components/Example";
import Page from "../components/Page";
import { componentSources } from "../content/componentSources";
import BothAxesScrollArea from "../examples/scroll-area/BothAxesScrollArea";
import bothAxesSrc from "../examples/scroll-area/BothAxesScrollArea.tsx?raw";
import VerticalScrollArea from "../examples/scroll-area/VerticalScrollArea";
import verticalSrc from "../examples/scroll-area/VerticalScrollArea.tsx?raw";
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
export default function ScrollAreaPage() {
  return (
    <Page
      title="Scroll area"
      meta={<Badge mono>components/ui/ScrollArea.tsx</Badge>}
      lede="Custom scrollbars over native scrolling. The viewport keeps native momentum, keyboard, and accessibility behavior."
    >
      <Example title="Vertical" src={verticalSrc}>
        <VerticalScrollArea />
      </Example>
      <Example title="Both axes" src={bothAxesSrc}>
        <BothAxesScrollArea />
      </Example>
      <Band bare>
        <BandHeader title="Source" note="components/ui/ScrollArea.tsx" />
        <div {...stylex.attrs(frame.inset, styles.sourceSection)}>
          <p {...stylex.attrs(styles.copy)}>Copy and paste the following code into your project.</p>
          <CodeBlock path="components/ui/ScrollArea.tsx" code={componentSources["scroll-area"]} />
        </div>
      </Band>
    </Page>
  );
}
