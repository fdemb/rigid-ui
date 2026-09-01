import Example from "../components/Example";
import Page from "../components/Page";
import BasicTooltip from "../examples/tooltip/BasicTooltip";
import basicSrc from "../examples/tooltip/BasicTooltip.tsx?raw";
import { Badge } from "../components/ui/Badge";

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
    </Page>
  );
}
