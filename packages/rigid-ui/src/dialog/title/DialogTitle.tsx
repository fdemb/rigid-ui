import { createEffect, createUniqueId, omit } from "solid-js";
import { useDialogRootContext } from "../root/DialogRootContext";
import { assignRef, type PopupNativeProps } from "../../utils/domProps";

export interface DialogTitleState {}
export interface DialogTitleProps extends PopupNativeProps<HTMLHeadingElement> {}

export function DialogTitle(props: DialogTitleProps) {
  const context = useDialogRootContext();
  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-dialog-title-${generatedId}`;
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

export namespace DialogTitle {
  export type State = DialogTitleState;
  export type Props = DialogTitleProps;
}
