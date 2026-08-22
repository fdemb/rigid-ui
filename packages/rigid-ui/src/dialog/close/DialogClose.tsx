import { createEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useDialogRootContext } from "../root/DialogRootContext";
import { renderElement } from "../../internals/renderElement";
import { REASONS } from "../../internals/reasons";
import type { PopupNativeProps } from "../../utils/domProps";

export interface DialogCloseState {
  disabled: boolean;
}

export interface DialogCloseProps extends PopupNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> {}

export function DialogClose(props: DialogCloseProps) {
  const context = useDialogRootContext();
  const disabled = () => props.disabled !== undefined && props.disabled !== false;

  createEffect(
    () => true,
    () => context!.registerClose(),
  );

  // The user's onClick is chained ahead of the internal handler by renderElement; the internal
  // handler only observes defaultPrevented and the shared prevention flag.
  return (
    <button
      {...renderElement<HTMLButtonElement>(props, {
        props: [
          {
            get type() {
              return props.type ?? "button";
            },
            onClick(event: MouseEvent) {
              if (event.defaultPrevented || disabled() || !context!.open()) return;
              context!.requestOpen(false, REASONS.closePress, event);
            },
          },
        ],
      })}
    >
      {props.children}
    </button>
  );
}

export namespace DialogClose {
  export type State = DialogCloseState;
  export type Props = DialogCloseProps;
}
