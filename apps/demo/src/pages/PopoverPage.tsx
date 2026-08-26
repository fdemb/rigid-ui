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

export default function PopoverPage() {
  return (
    <Page
      title="Popover"
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
        title="Composition with render"
        note="render takes a tag name, a component, or a callback that receives the part's props and state. It never takes a JSX element — Solid evaluates those eagerly, and the consumer's own bindings would win."
        src={composedSrc}
      >
        <ComposedPopover />
      </Example>
      <Example
        title="Shared popup with a payload"
        note="One Popover.Root serves every trigger. Switching triggers moves the same popup instead of building a new one — the move animates; repositioning from scrolling does not."
        src={sharedSrc}
      >
        <SharedTriggerPopover />
      </Example>
    </Page>
  );
}
