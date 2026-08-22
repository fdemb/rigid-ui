import { PopupHandle } from "../../utils/popupHandle";
import type { DialogRootContextValue } from "../root/DialogRootContext";

export class DialogHandle<Payload = unknown> extends PopupHandle<DialogRootContextValue<Payload>> {
  constructor() {
    super("Dialog");
  }

  open(triggerId: string | null) {
    const attached = this.attachedRoot();
    if (!attached) return;
    if (triggerId === null) {
      attached.requestOpen(true, "imperative-action");
      return;
    }
    attached.openByTrigger(triggerId, "imperative-action");
  }

  openWithPayload(payload: Payload) {
    const attached = this.attachedRoot();
    if (!attached) {
      console.warn(
        "Rigid UI: Dialog.Handle.openWithPayload() was called while no root using this handle is " +
          "mounted. The call and its payload were ignored; mount a root with this handle before " +
          "opening it imperatively.",
      );
      return;
    }
    attached.setExplicitPayload(payload);
    attached.requestOpen(true, "imperative-action");
  }
}

export function createDialogHandle<Payload = unknown>() {
  return new DialogHandle<Payload>();
}
