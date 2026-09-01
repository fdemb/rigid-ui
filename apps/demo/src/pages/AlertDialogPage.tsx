import * as stylex from "@stylexjs/stylex";

import Band, { BandHeader, frame } from "../components/Frame";
import CodeBlock from "../components/CodeBlock";
import Example from "../components/Example";
import Page from "../components/Page";
import { componentSources } from "../content/componentSources";
import DeletionAlert from "../examples/alert-dialog/DeletionAlert";
import deletionSrc from "../examples/alert-dialog/DeletionAlert.tsx?raw";
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
      <Band bare>
        <BandHeader title="Source" note="components/ui/Dialog.tsx" />
        <div {...stylex.attrs(frame.inset, styles.sourceSection)}>
          <p {...stylex.attrs(styles.copy)}>Copy and paste the following code into your project.</p>
          <CodeBlock path="components/ui/Dialog.tsx" code={componentSources["alert-dialog"]} />
        </div>
      </Band>
    </Page>
  );
}
