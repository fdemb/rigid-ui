import { createEffect, createSignal, omit, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useDialogRootContext } from "../root/DialogRootContext";
import { assignRef, mergeStyles, type PopupNativeProps } from "../../utils/domProps";
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
  const others = omit(props, "ref", "children", "style", "forceRender");
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
        {...others}
        ref={(node) => {
          setElement(node);
          assignRef(props.ref, node);
        }}
        role={props.role ?? "presentation"}
        hidden={!context!.mounted()}
        data-open={context!.open() ? "" : undefined}
        data-closed={!context!.open() ? "" : undefined}
        data-starting-style={context!.transitionStatus() === "starting" ? "" : undefined}
        data-ending-style={context!.transitionStatus() === "ending" ? "" : undefined}
        style={mergeStyles(
          {
            "user-select": "none",
            "-webkit-user-select": "none",
          },
          props.style as JSX.CSSProperties | string | undefined,
        )}
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
