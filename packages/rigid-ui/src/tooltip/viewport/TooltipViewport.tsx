import type { JSX } from "@solidjs/web";
import { useTooltipPositionerContext } from "../positioner/TooltipPositionerContext";
import { useTooltipRootContext } from "../root/TooltipRootContext";
import type { TooltipInstantType, TooltipNativeProps } from "../types";
import {
  createPopupViewport,
  type PopupViewportRootContext,
  type PopupViewportState,
} from "../../internals/popup-viewport/PopupViewport";

export interface TooltipViewportState extends PopupViewportState<
  Exclude<TooltipInstantType, undefined>
> {}
export interface TooltipViewportProps extends TooltipNativeProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  TooltipViewportState
> {}

export function TooltipViewport(props: TooltipViewportProps) {
  const root = useTooltipRootContext()!;
  const positioner = useTooltipPositionerContext();
  const viewportRoot: PopupViewportRootContext<Exclude<TooltipInstantType, undefined>> = {
    open: root.open,
    mounted: root.mounted,
    activeTriggerId: root.activeTriggerId,
    activeTriggerElement: () => root.activeTrigger()?.element(),
    payload: root.payload,
    popupElement: root.popupElement,
    positionerElement: root.positionerElement,
    instantType: root.instantType,
  };

  return createPopupViewport(props, viewportRoot, positioner);
}

export namespace TooltipViewport {
  export type State = TooltipViewportState;
  export type Props = TooltipViewportProps;
}
