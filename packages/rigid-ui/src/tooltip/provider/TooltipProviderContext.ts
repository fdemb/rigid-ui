import { createContext, useContext } from "solid-js";

export interface TooltipProviderContextValue {
  /** Default open delay for member tooltips without their own `delay`. */
  readonly delay: number | undefined;
  /** Default close delay for member tooltips without their own `closeDelay`. */
  readonly closeDelay: number | undefined;
  /**
   * Registers a tooltip root with the delay group. The accessor reports whether that root is
   * currently mounted (open or animating out). Returns an unregister function.
   */
  registerMember(active: () => boolean): () => void;
  /** How many group members are currently mounted, including the caller. */
  activeMembers(): number;
}

export const TooltipProviderContext = createContext<TooltipProviderContextValue | null>(null);

export function useTooltipProviderContext(optional = false) {
  const context = useContext(TooltipProviderContext);
  if (!context && !optional) {
    throw new Error("Rigid UI: Tooltip parts must be used within <Tooltip.Provider>.");
  }
  return context ?? undefined;
}
