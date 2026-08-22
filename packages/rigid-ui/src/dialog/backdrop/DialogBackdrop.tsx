import { createEffect, createSignal, Show } from "solid-js";
import { useDialogRootContext } from "../root/DialogRootContext";
import { renderElement } from "../../internals/renderElement";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping";
import type { PopupNativeProps } from "../../utils/domProps";
import type { DialogTransitionStatus } from "../types";

export interface DialogBackdropState {
  open: boolean;
  transitionStatus: DialogTransitionStatus;
}
export interface DialogBackdropProps extends PopupNativeProps<HTMLDivElement> {
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
      <div
        {...renderElement<
          HTMLDivElement,
          { open: boolean; transitionStatus: DialogTransitionStatus }
        >(props as Record<string, unknown>, {
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
      >
        {props.children}
      </div>
    </Show>
  );
}

export namespace DialogBackdrop {
  export type State = DialogBackdropState;
  export type Props = DialogBackdropProps;
}
