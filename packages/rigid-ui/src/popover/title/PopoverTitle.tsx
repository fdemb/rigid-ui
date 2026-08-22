import { createEffect, createUniqueId } from "solid-js";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { renderElement } from "../../internals/renderElement";
import type { PopoverNativeProps } from "../types";

export interface PopoverTitleState {}
export interface PopoverTitleProps extends PopoverNativeProps<HTMLHeadingElement> {}

export function PopoverTitle(props: PopoverTitleProps) {
  const context = usePopoverRootContext();
  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-popover-title-${generatedId}`;

  createEffect(
    () => id(),
    (currentId) => context!.registerTitle(currentId),
  );

  return (
    <h2
      {...renderElement<HTMLHeadingElement>(props, {
        props: {
          get id() {
            return id();
          },
        },
      })}
    >
      {props.children}
    </h2>
  );
}

export namespace PopoverTitle {
  export type State = PopoverTitleState;
  export type Props = PopoverTitleProps;
}
