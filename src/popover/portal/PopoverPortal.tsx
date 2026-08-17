import { omit, Show } from "solid-js";
import { Portal } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { PopoverPortalContext } from "./PopoverPortalContext";
import { assignRef, type PopoverNativeProps } from "../types";

export interface PopoverPortalState {}

export interface PopoverPortalProps extends PopoverNativeProps<HTMLDivElement> {
  keepMounted?: boolean;
  container?:
    | HTMLElement
    | ShadowRoot
    | { readonly current: HTMLElement | ShadowRoot | null }
    | null;
}

export function PopoverPortal(props: PopoverPortalProps) {
  const context = usePopoverRootContext();
  const others = omit(props, "ref", "children", "keepMounted", "container");
  const container = () => {
    const value = props.container;
    if (value && "current" in value) return value.current;
    return value;
  };

  return (
    <Show when={context!.mounted() || props.keepMounted}>
      <Portal mount={container() as Element | undefined}>
        <PopoverPortalContext value={props.keepMounted ?? false}>
          <div
            {...others}
            ref={(element) => {
              context!.setPortalElement(element);
              assignRef(props.ref, element);
            }}
            data-rigid-ui-portal=""
          >
            {props.children}
          </div>
        </PopoverPortalContext>
      </Portal>
    </Show>
  );
}

export namespace PopoverPortal {
  export type State = PopoverPortalState;
  export type Props = PopoverPortalProps;
}
