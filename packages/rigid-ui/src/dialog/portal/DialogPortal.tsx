import { createEffect, Show } from "solid-js";
import { Portal } from "@solidjs/web";
import { useDialogRootContext } from "../root/DialogRootContext";
import { InternalBackdrop } from "../../utils/InternalBackdrop";
import { renderPart } from "../../internals/renderPart";
import { type PopupNativeProps } from "../../utils/domProps";
import { DialogPortalContext } from "./DialogPortalContext";

export interface DialogPortalState {}

export interface DialogPortalProps extends PopupNativeProps<HTMLDivElement> {
  keepMounted?: boolean;
  container?:
    | HTMLElement
    | ShadowRoot
    | { readonly current: HTMLElement | ShadowRoot | null }
    | null;
}

export function DialogPortal(props: DialogPortalProps) {
  const context = useDialogRootContext();
  const container = () => {
    const value = props.container;
    if (value && "current" in value) return value.current;
    return value;
  };

  createEffect(
    () => context!.portalElement(),
    (element) => (element ? context!.registerPortalWithAncestors(element) : undefined),
  );

  return (
    <Portal mount={container() as Element | undefined}>
      <Show when={context!.mounted() || props.keepMounted}>
        <DialogPortalContext value={props.keepMounted ?? false}>
          {renderPart<HTMLDivElement>("div", props, {
            props: [{ "data-rigid-ui-portal": "" }],
            ref: [(element: HTMLDivElement) => context!.setPortalElement(element)],
            exclude: ["keepMounted", "container"],
            children: () => (
              <>
                {context!.mounted() && context!.modal() === true && (
                  <InternalBackdrop
                    ref={(element) => context!.setInternalBackdropElement(element)}
                    inert={!context!.open()}
                  />
                )}
                {props.children}
              </>
            ),
          })}
        </DialogPortalContext>
      </Show>
    </Portal>
  );
}

export namespace DialogPortal {
  export type State = DialogPortalState;
  export type Props = DialogPortalProps;
}
