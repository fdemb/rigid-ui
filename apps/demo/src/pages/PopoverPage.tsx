import Example from "../components/Example";
import Page from "../components/Page";
import BasicPopover from "../examples/popover/BasicPopover";
import ComposedPopover from "../examples/popover/ComposedPopover";
import composedSrc from "../examples/popover/ComposedPopover.tsx?raw";
import basicSrc from "../examples/popover/BasicPopover.tsx?raw";
import HoverPopover from "../examples/popover/HoverPopover";
import hoverSrc from "../examples/popover/HoverPopover.tsx?raw";
import SharedTriggerPopover from "../examples/popover/SharedTriggerPopover";
import sharedSrc from "../examples/popover/SharedTriggerPopover.tsx?raw";
import { Badge } from "../components/ui/Badge";

export default function PopoverPage() {
  return (
    <Page
      title="Popover"
      meta={<Badge mono>rigid-ui/primitives/popover</Badge>}
      lede="Anchored, non-blocking content positioned with Floating UI. Placement is reported back to JS as it resolves."
    >
      <Example title="Basic" src={basicSrc}>
        <BasicPopover />
      </Example>
      <Example
        title="Open on hover"
        note="openOnHover keeps the popup open while the pointer is over the trigger or the popup."
        src={hoverSrc}
      >
        <HoverPopover />
      </Example>
      <Example
        title="Style override"
        note="Registry components accept StyleX overrides, so consumers can change a local decision without first forking the component structure."
        src={composedSrc}
      >
        <ComposedPopover />
      </Example>
      <Example
        title="Shared popup with a payload"
        note="One Popover.Root serves every trigger. Switching triggers animates the same popup to its new position. Scrolling repositions it immediately."
        src={sharedSrc}
      >
        <SharedTriggerPopover />
      </Example>
    </Page>
  );
}
