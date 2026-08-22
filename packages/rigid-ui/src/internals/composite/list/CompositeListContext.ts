import { createContext, useContext } from "solid-js";

/**
 * Solid port of Base UI's `internals/composite/list/CompositeListContext.ts`.
 * Registration plumbing is provided by the nearest <Composite.List> (or root's implicit list);
 * defaults are no-ops so an item rendered outside a list still renders.
 */

export interface CompositeListRegistration {
  metadata: unknown;
  index: number | null;
  label: string | null | undefined;
  textRef: { current: string | null } | undefined;
}

export interface CompositeListContextValue {
  register(element: Element, registration: Partial<CompositeListRegistration>): () => void;
  unregister(element: Element): void;
}

export const CompositeListContext = createContext<CompositeListContextValue>({
  register: () => () => {},
  unregister: () => {},
});

export function useCompositeListContext() {
  return useContext(CompositeListContext);
}
