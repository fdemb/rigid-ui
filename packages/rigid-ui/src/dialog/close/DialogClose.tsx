import { createEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useDialogRootContext } from "../root/DialogRootContext";
import { renderPart } from "../../internals/renderPart";
import { useButton } from "../../internals/use-button/useButton";
import { REASONS } from "../../internals/reasons";
import type { PopupNativeProps } from "../../utils/domProps";

export interface DialogCloseState {
  disabled: boolean;
}

export interface DialogCloseProps extends PopupNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  DialogCloseState
> {
  /**
   * Whether the rendered element is a native `<button>`. Set to `false` when `render` replaces it
   * with something else, so button semantics are applied instead of assumed.
   * @default true
   */
  nativeButton?: boolean;
}

export function DialogClose(props: DialogCloseProps) {
  const context = useDialogRootContext();
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
  // handler only observes defaultPrevented and the shared prevention flag.
  return renderPart<HTMLButtonElement, DialogCloseState>("button", props, {
    state: () => ({ disabled: disabled() }),
    props: [
      {
        onClick(event: MouseEvent) {
          if (event.defaultPrevented || disabled() || !context!.open()) return;
          context!.requestOpen(false, REASONS.closePress, event);
        },
      },
    ],
    propsGetter: getButtonProps,
    ref: buttonRef as (element: HTMLButtonElement) => void,
    exclude: ["nativeButton"],
  });
}

export namespace DialogClose {
  export type State = DialogCloseState;
  export type Props = DialogCloseProps;
}
