import { usePopoverRootContext } from "../root/PopoverRootContext";
import { renderElement } from "../../internals/renderElement";
import type { PopoverNativeProps, PopoverTransitionStatus } from "../types";

export interface PopoverBackdropState {
  open: boolean;
  transitionStatus: PopoverTransitionStatus;
}
export interface PopoverBackdropProps extends PopoverNativeProps<HTMLDivElement> {}

export function PopoverBackdrop(props: PopoverBackdropProps) {
  const context = usePopoverRootContext();

  return (
    <div
      {...renderElement<HTMLDivElement>(props, {
        props: {
          get role() {
            return props.role ?? "presentation";
          },
          get hidden() {
            return !context!.mounted();
          },
          get "data-open"() {
            return context!.open() ? "" : undefined;
          },
          get "data-closed"() {
            return !context!.open() ? "" : undefined;
          },
          get "data-starting-style"() {
            return context!.transitionStatus() === "starting" ? "" : undefined;
          },
          get "data-ending-style"() {
            return context!.transitionStatus() === "ending" ? "" : undefined;
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
      })}
    >
      {props.children}
    </div>
  );
}

export namespace PopoverBackdrop {
  export type State = PopoverBackdropState;
  export type Props = PopoverBackdropProps;
}
