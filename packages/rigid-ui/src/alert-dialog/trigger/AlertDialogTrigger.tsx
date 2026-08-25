import type { JSX } from "@solidjs/web";
import { DialogTrigger, type DialogTriggerProps } from "../../dialog/trigger/DialogTrigger";
import type { AlertDialogHandle } from "../store/AlertDialogHandle";

export interface AlertDialogTriggerProps<Payload = unknown> extends Omit<
  DialogTriggerProps<Payload>,
  "handle"
> {
  /** A handle to associate the trigger with an alert dialog rendered elsewhere. */
  handle?: AlertDialogHandle<Payload>;
}

/**
 * A button that opens the alert dialog. Renders a `<button>` element.
 */
export const AlertDialogTrigger = DialogTrigger as <Payload = unknown>(
  props: AlertDialogTriggerProps<Payload>,
) => JSX.Element;

export namespace AlertDialogTrigger {
  export type Props<Payload = unknown> = AlertDialogTriggerProps<Payload>;
}
