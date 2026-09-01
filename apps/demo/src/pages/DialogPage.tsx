import * as stylex from "@stylexjs/stylex";

import Band, { BandHeader, frame } from "../components/Frame";
import CodeBlock from "../components/CodeBlock";
import Example from "../components/Example";
import Page from "../components/Page";
import { componentSources } from "../content/componentSources";
import ConfirmationDialog from "../examples/dialog/ConfirmationDialog";
import confirmationSrc from "../examples/dialog/ConfirmationDialog.tsx?raw";
import NonModalDialog from "../examples/dialog/NonModalDialog";
import nonModalSrc from "../examples/dialog/NonModalDialog.tsx?raw";
import { Badge } from "../components/ui/Badge";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  sourceSection: { paddingBlock: "1.25rem" },
  copy: {
    color: tokens.textMuted,
    fontSize: "0.875rem",
    lineHeight: 1.65,
    margin: "0 0 0.9rem",
    maxWidth: "46rem",
  },
});
export default function DialogPage() {
  return (
    <Page
      title="Dialog"
      meta={<Badge mono>components/ui/Dialog.tsx</Badge>}
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
      <Band bare>
        <BandHeader title="Source" note="components/ui/Dialog.tsx" />
        <div {...stylex.attrs(frame.inset, styles.sourceSection)}>
          <p {...stylex.attrs(styles.copy)}>Copy and paste the following code into your project.</p>
          <CodeBlock path="components/ui/Dialog.tsx" code={componentSources.dialog} />
        </div>
      </Band>
    </Page>
  );
}
