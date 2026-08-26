import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { useDialogPortalContext } from "../portal/DialogPortalContext";
import { useDialogRootContext } from "../root/DialogRootContext";
import { renderPart } from "../../internals/renderPart";
import type { StateAttributesMapping } from "../../internals/getStateAttributesProps";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping";
import type { PopupNativeProps } from "../../utils/domProps";
import type { DialogTransitionStatus } from "../types";

export type DialogViewportState = {
  open: boolean;
  transitionStatus: DialogTransitionStatus;
  nested: boolean;
  nestedDialogOpen: boolean;
};

export interface DialogViewportProps extends PopupNativeProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  DialogViewportState
> {}

const NESTED_DIALOG_OPEN_HOOK = { "data-nested-dialog-open": "" };

const nestedDialogOpenMapping = {
  nestedDialogOpen(value: boolean) {
    return value ? NESTED_DIALOG_OPEN_HOOK : null;
  },
} satisfies StateAttributesMapping<{ nestedDialogOpen: boolean }>;

/** A positioning container for the dialog popup that can be made scrollable. */
export function DialogViewport(props: DialogViewportProps) {
  const context = useDialogRootContext();
  const keepMounted = useDialogPortalContext();

  return (
    <Show when={keepMounted || context!.mounted()}>
      {renderPart<HTMLDivElement, DialogViewportState>("div", props, {
        props: {
          role: "presentation",
          get hidden() {
            return !context!.mounted();
          },
          get style() {
            return { "pointer-events": !context!.open() ? "none" : undefined };
          },
        },
        state: () => ({
          open: context!.open(),
          transitionStatus: context!.transitionStatus(),
          nested: context!.nested,
          nestedDialogOpen: context!.nestedOpenDialogCount() > 0,
        }),
        stateAttributesMapping: { ...popupTransitionStateMapping, ...nestedDialogOpenMapping },
      })}
    </Show>
  );
}

export namespace DialogViewport {
  export type State = DialogViewportState;
  export type Props = DialogViewportProps;
}
