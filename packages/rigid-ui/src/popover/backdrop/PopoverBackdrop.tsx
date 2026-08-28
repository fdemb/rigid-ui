import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { renderPart } from "../../internals/renderPart";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping";
import type { PopoverNativeProps, PopoverTransitionStatus } from "../types";

export interface PopoverBackdropState {
  open: boolean;
  transitionStatus: PopoverTransitionStatus;
}
export interface PopoverBackdropProps extends PopoverNativeProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  PopoverBackdropState
> {}

export function PopoverBackdrop(props: PopoverBackdropProps) {
  const context = usePopoverRootContext();

  return renderPart<HTMLDivElement, PopoverBackdropState>("div", props, {
    state: () => ({
      open: context!.open(),
      transitionStatus: context!.transitionStatus(),
    }),
    stateAttributesMapping: popupTransitionStateMapping,
    props: {
      get role() {
        return props.role ?? "presentation";
      },
      get hidden() {
        return !context!.mounted();
      },
      // Merged with the consumer's style by the internal mergeProps: internal values first,
      // user overrides per property.
      get style() {
        return {
          "pointer-events": context!.openReason() === "trigger-hover" ? "none" : undefined,
          "user-select": "none",
          "-webkit-user-select": "none",
        };
      },
    },
  });
}

export namespace PopoverBackdrop {
  export type State = PopoverBackdropState;
  export type Props = PopoverBackdropProps;
}
