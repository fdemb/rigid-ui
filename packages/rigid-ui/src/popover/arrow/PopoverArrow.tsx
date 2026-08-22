import { onCleanup } from "solid-js";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { usePopoverPositionerContext } from "../positioner/PopoverPositionerContext";
import { renderElement } from "../../internals/renderElement";
import type { PopoverAlign, PopoverNativeProps, PopoverSide } from "../types";

export interface PopoverArrowState {
  open: boolean;
  side: PopoverSide;
  align: PopoverAlign;
  uncentered: boolean;
}
export interface PopoverArrowProps extends PopoverNativeProps<HTMLDivElement> {}

export function PopoverArrow(props: PopoverArrowProps) {
  const context = usePopoverRootContext();
  const positioner = usePopoverPositionerContext();

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

export namespace PopoverArrow {
  export type State = PopoverArrowState;
  export type Props = PopoverArrowProps;
}
