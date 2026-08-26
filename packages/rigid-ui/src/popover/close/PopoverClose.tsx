import { createEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { renderPart } from "../../internals/renderPart";
import { useButton } from "../../internals/use-button/useButton";
import { REASONS } from "../../internals/reasons";
import type { PopoverNativeProps } from "../types";

export interface PopoverCloseState {
  disabled: boolean;
}
export interface PopoverCloseProps extends PopoverNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  PopoverCloseState
> {
  /**
   * Whether the rendered element is a native `<button>`. Set to `false` when `render` replaces it
   * with something else, so button semantics are applied instead of assumed.
   * @default true
   */
  nativeButton?: boolean;
}

export function PopoverClose(props: PopoverCloseProps) {
  const context = usePopoverRootContext();
  const disabled = () => props.disabled !== undefined && props.disabled !== false;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: () => props.nativeButton ?? true,
  });

  createEffect(
    () => true,
    () => context!.registerClose(),
  );

  // The user's onClick is chained ahead of the internal handler by renderPart; the internal
  // handler only observes defaultPrevented.
  return renderPart<HTMLButtonElement, PopoverCloseState>("button", props, {
    state: () => ({ disabled: disabled() }),
    props: {
      get disabled() {
        return disabled();
      },
      onClick(event: MouseEvent) {
        if (event.defaultPrevented || disabled()) return;
        context!.requestOpen(false, REASONS.closePress, event);
      },
    },
    propsGetter: getButtonProps,
    ref: buttonRef as (element: HTMLButtonElement) => void,
    exclude: ["nativeButton"],
  });
}

export namespace PopoverClose {
  export type State = PopoverCloseState;
  export type Props = PopoverCloseProps;
}
