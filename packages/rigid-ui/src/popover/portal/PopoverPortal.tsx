import { createEffect, Show } from "solid-js";
import { Portal } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { renderElement } from "../../internals/renderElement";
import { PopoverPortalContext } from "./PopoverPortalContext";
import type { PopoverNativeProps } from "../types";

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
        <PopoverPortalContext value={props.keepMounted ?? false}>
          <div
            {...renderElement<HTMLDivElement>(props as unknown as Record<string, unknown>, {
              props: { "data-rigid-ui-portal": "" },
              ref: (element: HTMLDivElement) => context!.setPortalElement(element),
              exclude: ["keepMounted", "container"],
            })}
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
