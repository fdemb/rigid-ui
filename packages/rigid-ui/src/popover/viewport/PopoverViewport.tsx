import { usePopoverPositionerContext } from "../positioner/PopoverPositionerContext";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import type { PopoverInstantType, PopoverNativeProps } from "../types";
import {
  createPopupViewport,
  type PopupViewportRootContext,
  type PopupViewportState,
} from "../../internals/popup-viewport/PopupViewport";

export interface PopoverViewportState extends PopupViewportState<
  Exclude<PopoverInstantType, undefined>
> {}
export interface PopoverViewportProps extends PopoverNativeProps<HTMLDivElement> {}

export function PopoverViewport(props: PopoverViewportProps) {
  const root = usePopoverRootContext()!;
  const positioner = usePopoverPositionerContext();
  const viewportRoot: PopupViewportRootContext<Exclude<PopoverInstantType, undefined>> = {
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

export namespace PopoverViewport {
  export type State = PopoverViewportState;
  export type Props = PopoverViewportProps;
}
