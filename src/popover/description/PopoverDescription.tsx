import { createEffect, createUniqueId, omit } from "solid-js";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { assignRef, type PopoverNativeProps } from "../types";

export interface PopoverDescriptionState {}
export interface PopoverDescriptionProps extends PopoverNativeProps<HTMLParagraphElement> {}

export function PopoverDescription(props: PopoverDescriptionProps) {
  const context = usePopoverRootContext();
  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-popover-description-${generatedId}`;
  const others = omit(props, "ref", "children");

  createEffect(
    () => id(),
    (currentId) => context!.registerDescription(currentId),
  );

  return (
    <p {...others} id={id()} ref={(element) => assignRef(props.ref, element)}>
      {props.children}
    </p>
  );
}

export namespace PopoverDescription {
  export type State = PopoverDescriptionState;
  export type Props = PopoverDescriptionProps;
}
