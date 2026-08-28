import type { JSX } from "@solidjs/web";
import { onCleanup } from "solid-js";
import { useTooltipRootContext } from "../root/TooltipRootContext";
import { useTooltipPositionerContext } from "../positioner/TooltipPositionerContext";
import { renderPart } from "../../internals/renderPart";
import { popupStateMapping } from "../../utils/popupStateMapping";
import type { TooltipAlign, TooltipNativeProps, TooltipSide } from "../types";

export interface TooltipArrowState {
  open: boolean;
  side: TooltipSide;
  align: TooltipAlign;
  uncentered: boolean;
}
export interface TooltipArrowProps extends TooltipNativeProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  TooltipArrowState
> {}

export function TooltipArrow(props: TooltipArrowProps) {
  const context = useTooltipRootContext();
  const positioner = useTooltipPositionerContext();

  onCleanup(() => positioner!.setArrowElement(undefined));

  return renderPart<HTMLDivElement, TooltipArrowState>("div", props, {
    state: () => ({
      open: context!.open(),
      side: positioner!.side(),
      align: positioner!.align(),
      uncentered: positioner!.arrowUncentered(),
    }),
    stateAttributesMapping: popupStateMapping,
    props: {
      "aria-hidden": "true",
      // Merged with the consumer's style by the internal mergeProps: internal values first,
      // user overrides per property.
      get style() {
        return { ...positioner!.arrowStyles() };
      },
    },
    ref: (element: HTMLDivElement) => positioner!.setArrowElement(element),
  });
}

export namespace TooltipArrow {
  export type State = TooltipArrowState;
  export type Props = TooltipArrowProps;
}
