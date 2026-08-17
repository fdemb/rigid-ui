import { omit } from "solid-js";
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

  function arrowStyle(): JSX.CSSProperties | string {
    const side = positioner!.side();
    const horizontalSide = side === "left" || side === "right" || side.startsWith("inline");
    const offset = positioner!.arrowOffset();
    const base: JSX.CSSProperties & Record<string, string | number | undefined> = {
      position: "absolute",
      top: side === "top" ? "100%" : horizontalSide ? `${offset.y}px` : undefined,
      bottom: side === "bottom" ? "100%" : undefined,
      left:
        side === "left" || side === "inline-start"
          ? "100%"
          : horizontalSide
            ? undefined
            : `${offset.x}px`,
      right: side === "right" || side === "inline-end" ? "100%" : undefined,
      translate: horizontalSide ? `0 -50%` : `-50% 0`,
    };
    return mergeStyles(base, props.style);
  }

  return (
    <div
      {...others}
      ref={(element) => assignRef(props.ref, element)}
      aria-hidden="true"
      data-open={context!.open() ? "" : undefined}
      data-closed={!context!.open() ? "" : undefined}
      data-side={positioner!.side()}
      data-align={positioner!.align()}
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
