import type { JSX } from "@solidjs/web";
import { useTooltipRootContext } from "../root/TooltipRootContext";
import { useTooltipPositionerContext } from "../positioner/TooltipPositionerContext";
import { renderPart } from "../../internals/renderPart";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping";
import { callEventHandler } from "../../utils/domProps";
import type {
  TooltipAlign,
  TooltipInstantType,
  TooltipNativeProps,
  TooltipSide,
  TooltipTransitionStatus,
} from "../types";

export interface TooltipPopupState {
  /** Whether the tooltip is currently open. */
  open: boolean;
  side: TooltipSide;
  align: TooltipAlign;
  instant: TooltipInstantType;
  transitionStatus: TooltipTransitionStatus;
}

export interface TooltipPopupProps extends TooltipNativeProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  TooltipPopupState
> {}

export function TooltipPopup(props: TooltipPopupProps) {
  const context = useTooltipRootContext();
  const positioner = useTooltipPositionerContext();
  // Transition/animation events bubble, so the consumer's handler must stay gated on the popup
  // itself — it cannot go through the automatic user-first chaining.
  function handleTransitionEnd(event: TransitionEvent) {
    if (event.target === event.currentTarget) callEventHandler(props.onTransitionEnd, event);
  }

  function handleAnimationEnd(event: AnimationEvent) {
    if (event.target === event.currentTarget) callEventHandler(props.onAnimationEnd, event);
  }

  return renderPart<HTMLDivElement, TooltipPopupState>("div", props, {
    props: {
      get id() {
        return props.id ?? context!.popupId;
      },
      get tabindex() {
        return props.tabindex ?? -1;
      },
      onTransitionEnd: handleTransitionEnd,
      onAnimationEnd: handleAnimationEnd,
    },
    state: () => ({
      open: context!.open(),
      side: positioner!.side(),
      align: positioner!.align(),
      instant: context!.instantType(),
      transitionStatus: context!.transitionStatus(),
    }),
    stateAttributesMapping: { ...popupTransitionStateMapping },
    ref: (node: HTMLDivElement) => context!.setPopupElement(node),
    exclude: ["onTransitionEnd", "onAnimationEnd"],
  });
}

export namespace TooltipPopup {
  export type State = TooltipPopupState;
  export type Props = TooltipPopupProps;
}
