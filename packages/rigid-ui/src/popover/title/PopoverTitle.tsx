import { createEffect, createUniqueId, omit } from "solid-js";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { assignRef, type PopoverNativeProps } from "../types";

export interface PopoverTitleState {}
export interface PopoverTitleProps extends PopoverNativeProps<HTMLHeadingElement> {}

export function PopoverTitle(props: PopoverTitleProps) {
  const context = usePopoverRootContext();
  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-popover-title-${generatedId}`;
  const others = omit(props, "ref", "children");

  createEffect(
    () => id(),
    (currentId) => context!.registerTitle(currentId),
  );

  return (
    <h2 {...others} id={id()} ref={(element) => assignRef(props.ref, element)}>
      {props.children}
    </h2>
  );
}

export namespace PopoverTitle {
  export type State = PopoverTitleState;
  export type Props = PopoverTitleProps;
}
