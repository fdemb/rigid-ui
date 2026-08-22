import { createEffect, omit } from "solid-js";
import { useDialogRootContext } from "../root/DialogRootContext";
import { assignRef, callEventHandler, type PopupNativeProps } from "../../utils/domProps";
import type { JSX } from "@solidjs/web";

export interface DialogCloseState {
  disabled: boolean;
}
export interface DialogCloseProps extends PopupNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> {}

export function DialogClose(props: DialogCloseProps) {
  const context = useDialogRootContext();
  const others = omit(props, "ref", "children", "onClick");
  const disabled = () => props.disabled !== undefined && props.disabled !== false;

  createEffect(
    () => true,
    () => context!.registerClose(),
  );

  function handleClick(event: MouseEvent) {
    callEventHandler(props.onClick, event);
    if (event.defaultPrevented || disabled() || !context!.open()) return;
    context!.requestOpen(false, "close-press", event);
  }

  return (
    <button
      {...others}
      ref={(element) => assignRef(props.ref, element)}
      type={props.type ?? "button"}
      disabled={disabled()}
      onClick={handleClick}
    >
      {props.children}
    </button>
  );
}

export namespace DialogClose {
  export type State = DialogCloseState;
  export type Props = DialogCloseProps;
}
