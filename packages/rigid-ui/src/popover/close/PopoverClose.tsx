import { createEffect, omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { assignRef, callEventHandler, type PopoverNativeProps } from "../types";

export interface PopoverCloseState {}
export interface PopoverCloseProps extends PopoverNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> {}

export function PopoverClose(props: PopoverCloseProps) {
  const context = usePopoverRootContext();
  const others = omit(props, "ref", "children", "onClick");
  const disabled = () => props.disabled !== undefined && props.disabled !== false;

  createEffect(
    () => true,
    () => context!.registerClose(),
  );

  function handleClick(event: MouseEvent) {
    callEventHandler(props.onClick, event);
    if (event.defaultPrevented || disabled()) return;
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

export namespace PopoverClose {
  export type State = PopoverCloseState;
  export type Props = PopoverCloseProps;
}
