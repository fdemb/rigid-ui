import type { JSX } from "@solidjs/web";
import { createEffect, createSignal, Show } from "solid-js";
import { useDialogRootContext } from "../root/DialogRootContext";
import { renderPart } from "../../internals/renderPart";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping";
import type { PopupNativeProps } from "../../utils/domProps";
import type { DialogTransitionStatus } from "../types";

export interface DialogBackdropState {
  open: boolean;
  transitionStatus: DialogTransitionStatus;
}
export interface DialogBackdropProps extends PopupNativeProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  DialogBackdropState
> {
  /** Whether the backdrop renders even when nested inside another dialog. */
  forceRender?: boolean;
}

export function DialogBackdrop(props: DialogBackdropProps) {
  const context = useDialogRootContext();
  const [element, setElement] = createSignal<HTMLDivElement>();

  createEffect(
    () => element(),
    (backdrop) => {
      if (!backdrop) return;
      context!.setBackdropElement(backdrop);
      return () => {
        if (context!.backdropElement() === backdrop) context!.setBackdropElement(undefined);
      };
    },
  );

  return (
    <Show when={!context!.nested || props.forceRender}>
      {renderPart<HTMLDivElement, DialogBackdropState>("div", props, {
        props: [
          {
            get role() {
              return props.role ?? "presentation";
            },
            get hidden() {
              return !context!.mounted();
            },
            style: {
              "user-select": "none",
              "-webkit-user-select": "none",
            },
          },
        ],
        state: () => ({
          open: context!.open(),
          transitionStatus: context!.transitionStatus(),
        }),
        stateAttributesMapping: popupTransitionStateMapping,
        ref: setElement,
        exclude: ["forceRender"],
      })}
    </Show>
  );
}

export namespace DialogBackdrop {
  export type State = DialogBackdropState;
  export type Props = DialogBackdropProps;
}
