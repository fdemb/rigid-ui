import { createContext, useContext } from "solid-js";
import type { Accessor } from "solid-js";

/**
 * Solid port of Base UI's
 * `internals/composite/root/CompositeRootContext.ts`. Presence of this context is what makes
 * `useButton` treat a part as a composite item (Space activates on keydown).
 */

export interface CompositeRootContextValue {
  highlightedIndex: Accessor<number>;
  onHighlightedIndexChange(index: number, shouldScrollIntoView?: boolean): void;
  highlightItemOnHover: Accessor<boolean>;
}

export const CompositeRootContext = createContext<CompositeRootContextValue | null>(null);

export function useCompositeRootContext(optional = false) {
  const context = useContext(CompositeRootContext);
  if (!context && !optional) {
    throw new Error("Rigid UI: composite items must be used within <Composite.Root>.");
  }
  return context ?? undefined;
}
