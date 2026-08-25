import { Show } from "solid-js";
import { Portal } from "@solidjs/web";
import { useTooltipRootContext } from "../root/TooltipRootContext";
import { renderElement } from "../../internals/renderElement";
import { TooltipPortalContext } from "./TooltipPortalContext";
import type { TooltipNativeProps } from "../types";

export interface TooltipPortalState {}

export interface TooltipPortalProps extends TooltipNativeProps<HTMLDivElement> {
  keepMounted?: boolean;
  container?:
    | HTMLElement
    | ShadowRoot
    | { readonly current: HTMLElement | ShadowRoot | null }
    | null;
}

export function TooltipPortal(props: TooltipPortalProps) {
  const context = useTooltipRootContext();
  const container = () => {
    const value = props.container;
    if (value && "current" in value) return value.current;
    return value;
  };

  return (
    <Show when={context!.mounted() || props.keepMounted}>
      <Portal mount={container() as Element | undefined}>
        <TooltipPortalContext value={{ keepMounted: props.keepMounted ?? false }}>
          <div
            {...renderElement<HTMLDivElement>(props as unknown as Record<string, unknown>, {
              props: { "data-rigid-ui-portal": "" },
              ref: (element: HTMLDivElement) => context!.setPortalElement(element),
              exclude: ["keepMounted", "container"],
            })}
          >
            {props.children}
          </div>
        </TooltipPortalContext>
      </Portal>
    </Show>
  );
}

export namespace TooltipPortal {
  export type State = TooltipPortalState;
  export type Props = TooltipPortalProps;
}
