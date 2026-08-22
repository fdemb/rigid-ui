import { createEffect, createUniqueId, omit } from "solid-js";
import { useDialogRootContext } from "../root/DialogRootContext";
import { assignRef, type PopupNativeProps } from "../../utils/domProps";

export interface DialogDescriptionState {}
export interface DialogDescriptionProps extends PopupNativeProps<HTMLParagraphElement> {}

export function DialogDescription(props: DialogDescriptionProps) {
  const context = useDialogRootContext();
  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-dialog-description-${generatedId}`;
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

export namespace DialogDescription {
  export type State = DialogDescriptionState;
  export type Props = DialogDescriptionProps;
}
