import type { JSX } from "@solidjs/web";
import { createDialogRoot, type DialogRootProps } from "../../dialog/root/DialogRoot";
import type {
  DialogRootActions,
  DialogRootChangeEventDetails,
  DialogRootChangeEventReason,
} from "../../dialog/types";
import type { AlertDialogHandle } from "../store/AlertDialogHandle";

export interface AlertDialogRootProps<Payload = unknown> extends Omit<
  DialogRootProps<Payload>,
  "modal" | "disablePointerDismissal"
> {
  handle?: AlertDialogHandle<Payload>;
}

export type AlertDialogRootState = Record<never, never>;

/**
 * Groups all parts of the alert dialog. Doesn't render its own HTML element.
 *
 * An alert dialog is a fully modal dialog that interrupts the user's task: it cannot be dismissed
 * by pressing outside of it, and its popup carries the `alertdialog` role.
 */
export function AlertDialogRoot<Payload = unknown>(props: AlertDialogRootProps<Payload>) {
  return createDialogRoot<Payload>("alert-dialog", props as DialogRootProps<Payload>);
}

export namespace AlertDialogRoot {
  export type State = AlertDialogRootState;
  export type Props<Payload = unknown> = AlertDialogRootProps<Payload>;
  export type Actions = DialogRootActions;
  export type ChangeEventReason = DialogRootChangeEventReason;
  export type ChangeEventDetails = DialogRootChangeEventDetails;
}
