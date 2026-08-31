import { AlertDialog, DialogFooter } from "../../components/ui/Dialog";

export default function DeletionAlert() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>Revoke key</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Revoke API key?</AlertDialog.Title>
        <AlertDialog.Description>
          Requests using this key will start failing immediately. An alert dialog requires an
          explicit response and cannot be dismissed by clicking outside.
        </AlertDialog.Description>
        <DialogFooter>
          <AlertDialog.Close>Keep key</AlertDialog.Close>
          <AlertDialog.Close variant="danger">Revoke</AlertDialog.Close>
        </DialogFooter>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
