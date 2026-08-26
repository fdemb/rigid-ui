import type { JSX } from "@solidjs/web";
import { onCleanup } from "solid-js";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { usePopoverPositionerContext } from "../positioner/PopoverPositionerContext";
import { renderPart } from "../../internals/renderPart";
import { popupStateMapping } from "../../utils/popupStateMapping";
import type { PopoverAlign, PopoverNativeProps, PopoverSide } from "../types";

export interface PopoverArrowState {
  open: boolean;
  side: PopoverSide;
  align: PopoverAlign;
  uncentered: boolean;
}
export interface PopoverArrowProps extends PopoverNativeProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  PopoverArrowState
> {}

export function PopoverArrow(props: PopoverArrowProps) {
  const context = usePopoverRootContext();
  const positioner = usePopoverPositionerContext();

  onCleanup(() => positioner!.setArrowElement(undefined));

  return renderPart<HTMLDivElement, PopoverArrowState>("div", props, {
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

export namespace PopoverArrow {
  export type State = PopoverArrowState;
  export type Props = PopoverArrowProps;
}
