import { createContext, useContext } from "solid-js";
import type { Accessor } from "solid-js";

/**
 * Solid port of Base UI's `internals/direction-context`. The context carries an accessor so
 * direction changes propagate reactively to consumers (composite navigation, anchor
 * positioning, scroll-area math).
 */

export type TextDirection = "ltr" | "rtl";

export interface DirectionContextValue {
  direction: Accessor<TextDirection>;
}

export const DirectionContext = createContext<DirectionContextValue | null>(null);

export function useDirectionContext(optional = false) {
  const context = useContext(DirectionContext);
  if (!context && !optional) {
    throw new Error("Rigid UI: direction-consuming parts must be used within <DirectionProvider>.");
  }
  return context ?? undefined;
}

/** Resolves the effective text direction, defaulting to `"ltr"` outside a provider. */
export function useDirection(): Accessor<TextDirection> {
  const context = useDirectionContext(true);
  if (!context) {
    return () => "ltr";
  }
  return context.direction;
}
