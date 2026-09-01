import Example from "../components/Example";
import Page from "../components/Page";
import DeletionAlert from "../examples/alert-dialog/DeletionAlert";
import deletionSrc from "../examples/alert-dialog/DeletionAlert.tsx?raw";
import { Badge } from "../components/ui/Badge";

export default function AlertDialogPage() {
  return (
    <Page
      title="Alert dialog"
      meta={<Badge mono>components/ui/Dialog.tsx</Badge>}
      lede="A modal dialog that interrupts the task. Clicking outside never dismisses it, and the popup carries the alertdialog role."
    >
      <Example
        title="Irreversible action"
        note="modal and disablePointerDismissal are forced; only Escape, Close parts, or imperative actions close it."
        src={deletionSrc}
      >
        <DeletionAlert />
      </Example>
    </Page>
  );
}
