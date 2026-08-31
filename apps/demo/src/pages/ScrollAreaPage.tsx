import Example from "../components/Example";
import Page from "../components/Page";
import BothAxesScrollArea from "../examples/scroll-area/BothAxesScrollArea";
import bothAxesSrc from "../examples/scroll-area/BothAxesScrollArea.tsx?raw";
import VerticalScrollArea from "../examples/scroll-area/VerticalScrollArea";
import verticalSrc from "../examples/scroll-area/VerticalScrollArea.tsx?raw";
import { Badge } from "../components/ui/Badge";

export default function ScrollAreaPage() {
  return (
    <Page
      eyebrow="Registry"
      title="Scroll area"
      meta={<Badge mono>rigid-ui/primitives/scroll-area</Badge>}
      lede="Custom scrollbars over native scrolling. The viewport keeps native momentum, keyboard, and accessibility behavior."
    >
      <Example title="Vertical" src={verticalSrc}>
        <VerticalScrollArea />
      </Example>
      <Example title="Both axes" src={bothAxesSrc}>
        <BothAxesScrollArea />
      </Example>
    </Page>
  );
}
