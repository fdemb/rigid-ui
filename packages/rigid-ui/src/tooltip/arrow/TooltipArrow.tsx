import { onCleanup } from "solid-js";
import { useTooltipRootContext } from "../root/TooltipRootContext";
import { useTooltipPositionerContext } from "../positioner/TooltipPositionerContext";
import { renderElement } from "../../internals/renderElement";
import type { TooltipAlign, TooltipNativeProps, TooltipSide } from "../types";

export interface TooltipArrowState {
  open: boolean;
  side: TooltipSide;
  align: TooltipAlign;
  uncentered: boolean;
}
export interface TooltipArrowProps extends TooltipNativeProps<HTMLDivElement> {}

export function TooltipArrow(props: TooltipArrowProps) {
  const context = useTooltipRootContext();
  const positioner = useTooltipPositionerContext();

  onCleanup(() => positioner!.setArrowElement(undefined));

  return (
    <div
      {...renderElement<HTMLDivElement>(props, {
        props: {
          "aria-hidden": "true",
          get "data-open"() {
            return context!.open() ? "" : undefined;
          },
          get "data-closed"() {
            return !context!.open() ? "" : undefined;
          },
          get "data-side"() {
            return positioner!.side();
          },
          get "data-align"() {
            return positioner!.align();
          },
          get "data-uncentered"() {
            return positioner!.arrowUncentered() ? "" : undefined;
          },
          // Merged with the consumer's style by the internal mergeProps: internal values first,
          // user overrides per property.
          get style() {
            return { ...positioner!.arrowStyles() };
          },
        },
        ref: (element: HTMLDivElement) => positioner!.setArrowElement(element),
      })}
    >
      {props.children}
    </div>
  );
}

export namespace TooltipArrow {
  export type State = TooltipArrowState;
  export type Props = TooltipArrowProps;
}
