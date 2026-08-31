import { Dialog, DialogFooter } from "../../components/ui/Dialog";

export default function NonModalDialog() {
  return (
    <Dialog.Root modal={false}>
      <Dialog.Trigger>Non-modal dialog</Dialog.Trigger>
      <Dialog.Content initialFocus={false} size="sm">
        <Dialog.Title>Non-modal dialog</Dialog.Title>
        <Dialog.Description>
          The page behind this dialog stays interactive; focus is not trapped.
        </Dialog.Description>
        <DialogFooter>
          <Dialog.Close>Close</Dialog.Close>
        </DialogFooter>
      </Dialog.Content>
    </Dialog.Root>
  );
}
