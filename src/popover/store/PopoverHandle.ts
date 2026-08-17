import { createSignal, type Accessor } from "solid-js";
import type { PopoverRootContextValue } from "../root/PopoverRootContext";

export class PopoverHandle<Payload = unknown> {
  readonly context: Accessor<PopoverRootContextValue<Payload> | undefined>;
  private readonly setContext: (context: PopoverRootContextValue<Payload> | undefined) => void;

  constructor() {
    const [context, setContext] = createSignal<PopoverRootContextValue<Payload>>();
    this.context = context;
    this.setContext = setContext;
  }

  attach(context: PopoverRootContextValue<Payload>) {
    if (this.context() && this.context() !== context) {
      console.warn("Rigid UI: a Popover.Handle cannot be attached to multiple mounted roots.");
    }
    this.setContext(context);
    return () => {
      if (this.context() === context) this.setContext(undefined);
    };
  }

  open(triggerId: string) {
    this.context()?.openByTrigger(triggerId, "imperative-action");
  }

  close() {
    this.context()?.requestOpen(false, "imperative-action");
  }

  get isOpen() {
    return this.context()?.open() ?? false;
  }
}

export function createPopoverHandle<Payload = unknown>() {
  return new PopoverHandle<Payload>();
}
