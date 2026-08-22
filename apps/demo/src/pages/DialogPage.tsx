import Example from "../components/Example";
import Page from "../components/Page";
import ConfirmationDialog from "../examples/dialog/ConfirmationDialog";
import confirmationSrc from "../examples/dialog/ConfirmationDialog.tsx?raw";
import NonModalDialog from "../examples/dialog/NonModalDialog";
import nonModalSrc from "../examples/dialog/NonModalDialog.tsx?raw";

export default function DialogPage() {
  return (
    <Page
      title="Dialog"
      lede="A window overlaid on the page. Modal dialogs trap focus and lock scroll; non-modal ones leave the page interactive."
    >
      <Example title="Modal confirmation" src={confirmationSrc}>
        <ConfirmationDialog />
      </Example>
      <Example
        title="Non-modal dialog"
        note="modal={false} keeps the page behind interactive; initialFocus={false} skips moving focus."
        src={nonModalSrc}
      >
        <NonModalDialog />
      </Example>
    </Page>
  );
}
