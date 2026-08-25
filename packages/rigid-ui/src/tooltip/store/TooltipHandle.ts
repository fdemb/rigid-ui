import { PopupHandle } from "../../utils/popupHandle";
import type { TooltipRootContextValue } from "../root/TooltipRootContext";

export class TooltipHandle<Payload = unknown> extends PopupHandle<
  TooltipRootContextValue<Payload>
> {
  constructor() {
    super("Tooltip");
  }

  open(triggerId: string) {
    this.attachedRoot()?.openByTrigger(triggerId, "imperative-action");
  }
}

export function createTooltipHandle<Payload = unknown>() {
  return new TooltipHandle<Payload>();
}
