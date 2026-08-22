import { createEffect, createUniqueId } from "solid-js";
import { useDialogRootContext } from "../root/DialogRootContext";
import { renderElement } from "../../internals/renderElement";
import { type PopupNativeProps } from "../../utils/domProps";

export interface DialogDescriptionState {}
export interface DialogDescriptionProps extends PopupNativeProps<HTMLParagraphElement> {}

export function DialogDescription(props: DialogDescriptionProps) {
  const context = useDialogRootContext();
  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-dialog-description-${generatedId}`;

  createEffect(
    () => id(),
    (currentId) => context!.registerDescription(currentId),
  );

  return (
    <p
      {...renderElement<HTMLParagraphElement>(props, {
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
    </p>
  );
}

export namespace DialogDescription {
  export type State = DialogDescriptionState;
  export type Props = DialogDescriptionProps;
}
