import { Dialog, DialogFooter } from "../../components/ui/Dialog";

export default function ConfirmationDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Delete project</Dialog.Trigger>
      <Dialog.Content size="sm">
        <Dialog.Title>Delete project?</Dialog.Title>
        <Dialog.Description>
          This permanently removes the project and all of its deployments. This action cannot be
          undone.
        </Dialog.Description>
        <DialogFooter>
          <Dialog.Close>Cancel</Dialog.Close>
          <Dialog.Close variant="danger">Delete</Dialog.Close>
        </DialogFooter>
      </Dialog.Content>
    </Dialog.Root>
  );
}
