import { omit } from "solid-js";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { assignRef, type PopoverNativeProps } from "../types";

export interface PopoverViewportState {
  activationDirection: string | undefined;
  transitioning: boolean;
  instant: "dismiss" | "click" | "focus" | "trigger-change" | undefined;
}
export interface PopoverViewportProps extends PopoverNativeProps<HTMLDivElement> {}

export function PopoverViewport(props: PopoverViewportProps) {
  usePopoverRootContext();
  const others = omit(props, "ref", "children");

  return (
    <div {...others} ref={(element) => assignRef(props.ref, element)}>
      <div data-current="">{props.children}</div>
    </div>
  );
}

export namespace PopoverViewport {
  export type State = PopoverViewportState;
  export type Props = PopoverViewportProps;
}
