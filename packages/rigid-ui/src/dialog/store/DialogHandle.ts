import { createSignal, type Accessor } from "solid-js";
import type { DialogRootContextValue } from "../root/DialogRootContext";

export class DialogHandle<Payload = unknown> {
  /** Reactive view of the attached root, for components that must re-run when it changes. */
  readonly context: Accessor<DialogRootContextValue<Payload> | undefined>;
  private readonly setContext: (context: DialogRootContextValue<Payload> | undefined) => void;
  /**
   * The attached root as a plain field. Signal writes are not visible to reads until the next
   * flush, so attachment bookkeeping and the imperative methods cannot go through the signal.
   */
  private attached: DialogRootContextValue<Payload> | undefined;

  constructor() {
    const [context, setContext] = createSignal<DialogRootContextValue<Payload>>();
    this.context = context;
    this.setContext = setContext;
  }

  attach(context: DialogRootContextValue<Payload>) {
    if (this.attached && this.attached !== context) {
      console.warn("Rigid UI: a Dialog.Handle cannot be attached to multiple mounted roots.");
    }
    this.attached = context;
    this.setContext(context);
    return () => {
      if (this.attached !== context) return;
      this.attached = undefined;
      this.setContext(undefined);
    };
  }

  open(triggerId: string | null) {
    const attached = this.attached;
    if (!attached) return;
    if (triggerId === null) {
      attached.requestOpen(true, "imperative-action");
      return;
    }
    attached.openByTrigger(triggerId, "imperative-action");
  }

  openWithPayload(payload: Payload) {
    const attached = this.attached;
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

  close() {
    this.attached?.requestOpen(false, "imperative-action");
  }

  get isOpen() {
    return this.attached?.open() ?? false;
  }
}

export function createDialogHandle<Payload = unknown>() {
  return new DialogHandle<Payload>();
}
