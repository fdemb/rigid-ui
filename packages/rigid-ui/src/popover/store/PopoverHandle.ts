import { createSignal, type Accessor } from "solid-js";
import type { PopoverRootContextValue } from "../root/PopoverRootContext";

export class PopoverHandle<Payload = unknown> {
  /** Reactive view of the attached root, for components that must re-run when it changes. */
  readonly context: Accessor<PopoverRootContextValue<Payload> | undefined>;
  private readonly setContext: (context: PopoverRootContextValue<Payload> | undefined) => void;
  /**
   * The attached root as a plain field. Signal writes are not visible to reads until the next
   * flush, so attachment bookkeeping and the imperative methods cannot go through the signal:
   * two roots mounting in the same tick would both read `undefined` and neither would warn, and
   * a call made right after unmount would still reach the detached root.
   */
  private attached: PopoverRootContextValue<Payload> | undefined;

  constructor() {
    const [context, setContext] = createSignal<PopoverRootContextValue<Payload>>();
    this.context = context;
    this.setContext = setContext;
  }

  attach(context: PopoverRootContextValue<Payload>) {
    if (this.attached && this.attached !== context) {
      console.warn("Rigid UI: a Popover.Handle cannot be attached to multiple mounted roots.");
    }
    this.attached = context;
    this.setContext(context);
    return () => {
      if (this.attached !== context) return;
      this.attached = undefined;
      this.setContext(undefined);
    };
  }

  open(triggerId: string) {
    this.attached?.openByTrigger(triggerId, "imperative-action");
  }

  close() {
    this.attached?.requestOpen(false, "imperative-action");
  }

  get isOpen() {
    return this.attached?.open() ?? false;
  }
}

export function createPopoverHandle<Payload = unknown>() {
  return new PopoverHandle<Payload>();
}
