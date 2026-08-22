import { createEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { renderElement } from "../../internals/renderElement";
import { REASONS } from "../../internals/reasons";
import type { PopoverNativeProps } from "../types";

export interface PopoverCloseState {}
export interface PopoverCloseProps extends PopoverNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> {}

export function PopoverClose(props: PopoverCloseProps) {
  const context = usePopoverRootContext();
  const disabled = () => props.disabled !== undefined && props.disabled !== false;

  createEffect(
    () => true,
    () => context!.registerClose(),
  );

  // The user's onClick is chained ahead of the internal handler by renderElement; the internal
  // handler only observes defaultPrevented.
  return (
    <button
      {...renderElement<HTMLButtonElement>(props, {
        props: {
          get type() {
            return props.type ?? "button";
          },
          get disabled() {
            return disabled();
          },
          onClick(event: MouseEvent) {
            if (event.defaultPrevented || disabled()) return;
            context!.requestOpen(false, REASONS.closePress, event);
          },
        },
      })}
    >
      {props.children}
    </button>
  );
}

export namespace PopoverClose {
  export type State = PopoverCloseState;
  export type Props = PopoverCloseProps;
}
