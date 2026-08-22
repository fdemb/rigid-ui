import { createSignal, type Accessor } from "solid-js";
import { REASONS } from "../internals/reasons";

/**
 * Shared imperative-handle base for the popup family (Dialog, Popover, later Menu/Select/…),
 * replacing the per-component copies of the same attachment bookkeeping.
 *
 * The attachment lives in a plain field, not the signal: signal writes are not visible to reads
 * until the next flush, so a second root mounting in the same tick would both read `undefined`
 * and neither would warn, and an imperative call made right after unmount would still reach the
 * detached root. `context` is the reactive view for components that must re-run on change.
 */

/** The slice of a popup root context that an imperative handle drives. */
export interface PopupHandleRoot {
  open(): boolean;
  requestOpen(open: boolean, reason: string, event?: Event, triggerId?: string): boolean;
}

export class PopupHandle<Root extends PopupHandleRoot> {
  /** Reactive view of the attached root, for detached triggers that re-run on change. */
  readonly context: Accessor<Root | undefined>;

  private readonly componentName: string;
  private readonly setContext: (context: Root | undefined) => void;
  private attached: Root | undefined;

  constructor(componentName: string) {
    this.componentName = componentName;
    const [context, setContext] = createSignal<Root | undefined>(undefined);
    this.context = context;
    this.setContext = setContext;
  }

  attach(context: Root) {
    if (this.attached && this.attached !== context) {
      console.warn(
        `Rigid UI: a ${this.componentName}.Handle cannot be attached to multiple mounted roots.`,
      );
    }
    this.attached = context;
    this.setContext(context);
    return () => {
      if (this.attached !== context) return;
      this.attached = undefined;
      this.setContext(undefined);
    };
  }

  protected attachedRoot(): Root | undefined {
    return this.attached;
  }

  close() {
    this.attached?.requestOpen(false, REASONS.imperativeAction);
  }

  get isOpen() {
    return this.attached?.open() ?? false;
  }
}
