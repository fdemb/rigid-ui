import { createEffect, createUniqueId } from "solid-js";
import { useDialogRootContext } from "../root/DialogRootContext";
import { renderElement } from "../../internals/renderElement";
import { type PopupNativeProps } from "../../utils/domProps";

export interface DialogTitleState {}
export interface DialogTitleProps extends PopupNativeProps<HTMLHeadingElement> {}

export function DialogTitle(props: DialogTitleProps) {
  const context = useDialogRootContext();
  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-dialog-title-${generatedId}`;

  createEffect(
    () => id(),
    (currentId) => context!.registerTitle(currentId),
  );

  return (
    <h2
      {...renderElement<HTMLHeadingElement>(props, {
        props: [
          {
            get id() {
              return id();
            },
          },
        ],
        exclude: ["id"],
      })}
    >
      {props.children}
    </h2>
  );
}

export namespace DialogTitle {
  export type State = DialogTitleState;
  export type Props = DialogTitleProps;
}
