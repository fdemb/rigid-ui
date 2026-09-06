import { Popover } from "../../components/ui/Popover";

export default function BasicPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger>Notifications</Popover.Trigger>
      <Popover.Content align="start">
        <Popover.Title>Notifications</Popover.Title>
        <Popover.Description>You are all caught up. Good job.</Popover.Description>
        <Popover.Close>Close</Popover.Close>
      </Popover.Content>
    </Popover.Root>
  );
}
