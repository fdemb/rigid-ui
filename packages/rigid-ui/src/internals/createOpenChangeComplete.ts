import { createEffect, onCleanup, untrack } from "solid-js";
import type { Accessor } from "solid-js";
import { runOnceAnimationsFinish } from "../utils/runOnceAnimationsFinish";

/**
 * Solid port of Base UI's
 * `reference/base-ui/packages/react/src/internals/useOpenChangeComplete.tsx`.
 *
 * Calls `onComplete` when the open/close CSS animation or transition on `element` finishes —
 * or immediately when there is none. Re-runs whenever `open` flips; an in-flight wait is
 * aborted when the effect disposes or dependencies change again.
 */
export interface CreateOpenChangeCompleteOptions {
  /** Whether the hook is enabled. @default true */
  enabled?: boolean | Accessor<boolean>;
  /** Whether the element is open. */
  open?: boolean | Accessor<boolean>;
  /**
   * The element being opened/closed. Read reactively; completion waits for the current element.
   */
  element: Accessor<HTMLElement | null | undefined>;
  /** Called when the animation completes (or there is no animation). */
  onComplete: () => void;
}

export function createOpenChangeComplete(options: CreateOpenChangeCompleteOptions) {
  const { enabled = true, open = true, element, onComplete } = options;

  const resolveEnabled = () => (typeof enabled === "function" ? enabled() : enabled);
  const resolveOpen = () => (typeof open === "function" ? open() : open);

  createEffect(
    () => ({ enabled: resolveEnabled(), open: resolveOpen(), el: element() }),
    ({ enabled: isEnabled }) => {
      const el = untrack(element);
      if (!isEnabled || !el) return;

      const abort = runOnceAnimationsFinish(el, onComplete, { waitForStartingStyle: true });
      onCleanup(() => abort());
    },
  );
}
