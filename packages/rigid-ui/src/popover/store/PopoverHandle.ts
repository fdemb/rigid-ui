import { PopupHandle } from "../../utils/popupHandle";
import type { PopoverRootContextValue } from "../root/PopoverRootContext";

export class PopoverHandle<Payload = unknown> extends PopupHandle<
  PopoverRootContextValue<Payload>
> {
  constructor() {
    super("Popover");
  }

  open(triggerId: string) {
    this.attachedRoot()?.openByTrigger(triggerId, "imperative-action");
  }
}

export function createPopoverHandle<Payload = unknown>() {
  return new PopoverHandle<Payload>();
}
