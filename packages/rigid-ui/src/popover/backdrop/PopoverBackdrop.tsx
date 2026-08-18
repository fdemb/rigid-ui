import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import {
  assignRef,
  mergeStyles,
  type PopoverNativeProps,
  type PopoverTransitionStatus,
} from "../types";

export interface PopoverBackdropState {
  open: boolean;
  transitionStatus: PopoverTransitionStatus;
}
export interface PopoverBackdropProps extends PopoverNativeProps<HTMLDivElement> {}

export function PopoverBackdrop(props: PopoverBackdropProps) {
  const context = usePopoverRootContext();
  const others = omit(props, "ref", "children", "style");
  const style = (): JSX.CSSProperties | string =>
    mergeStyles(
      {
        "pointer-events": context!.openReason() === "trigger-hover" ? "none" : undefined,
        "user-select": "none",
        "-webkit-user-select": "none",
      },
      props.style,
    );

  return (
    <div
      {...others}
      ref={(element) => assignRef(props.ref, element)}
      role={props.role ?? "presentation"}
      hidden={!context!.mounted()}
      data-open={context!.open() ? "" : undefined}
      data-closed={!context!.open() ? "" : undefined}
      data-starting-style={context!.transitionStatus() === "starting" ? "" : undefined}
      data-ending-style={context!.transitionStatus() === "ending" ? "" : undefined}
      style={style()}
    >
      {props.children}
    </div>
  );
}

export namespace PopoverBackdrop {
  export type State = PopoverBackdropState;
  export type Props = PopoverBackdropProps;
}
