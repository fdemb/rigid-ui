import { createEffect, Show } from "solid-js";
import { Portal } from "@solidjs/web";
import { useDialogRootContext } from "../root/DialogRootContext";
import { InternalBackdrop } from "../../utils/InternalBackdrop";
import { renderElement } from "../../internals/renderElement";
import { type PopupNativeProps } from "../../utils/domProps";

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
    <Show when={context!.mounted() || props.keepMounted}>
      <Portal mount={container() as Element | undefined}>
        <div
          {...renderElement<HTMLDivElement>(props as Record<string, unknown>, {
            props: [{ "data-rigid-ui-portal": "" }],
            ref: [(element: HTMLDivElement) => context!.setPortalElement(element)],
            exclude: ["keepMounted", "container"],
          })}
        >
          {context!.mounted() && context!.modal() === true && (
            <InternalBackdrop
              ref={(element) => context!.setInternalBackdropElement(element)}
              inert={!context!.open()}
            />
          )}
          {props.children}
        </div>
      </Portal>
    </Show>
  );
}

export namespace DialogPortal {
  export type State = DialogPortalState;
  export type Props = DialogPortalProps;
}
