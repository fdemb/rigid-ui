import { omit, onCleanup } from "solid-js";
import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { usePopoverPositionerContext } from "../positioner/PopoverPositionerContext";
import {
  assignRef,
  mergeStyles,
  type PopoverAlign,
  type PopoverNativeProps,
  type PopoverSide,
} from "../types";

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
  const others = omit(props, "ref", "children", "style");

  onCleanup(() => positioner!.setArrowElement(undefined));

  function arrowStyle(): JSX.CSSProperties | string {
    return mergeStyles({ ...positioner!.arrowStyles() }, props.style);
  }

  return (
    <div
      {...others}
      ref={(element) => {
        positioner!.setArrowElement(element);
        assignRef(props.ref, element);
      }}
      aria-hidden="true"
      data-open={context!.open() ? "" : undefined}
      data-closed={!context!.open() ? "" : undefined}
      data-side={positioner!.side()}
      data-align={positioner!.align()}
      data-uncentered={positioner!.arrowUncentered() ? "" : undefined}
      style={arrowStyle()}
    >
      {props.children}
    </div>
  );
}

export namespace PopoverArrow {
  export type State = PopoverArrowState;
  export type Props = PopoverArrowProps;
}
