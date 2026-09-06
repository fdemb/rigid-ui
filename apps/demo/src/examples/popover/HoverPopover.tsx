import { Popover } from "../../components/ui/Popover";

export default function HoverPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger openOnHover>Account</Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Signed in</Popover.Title>
        <Popover.Description>
          Hover stays open while the pointer is over the popup.
        </Popover.Description>
      </Popover.Content>
    </Popover.Root>
  );
}
