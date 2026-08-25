import { createContext, useContext } from "solid-js";

export interface TooltipPortalContextValue {
  keepMounted: boolean;
}

export const TooltipPortalContext = createContext<TooltipPortalContextValue | null>(null);

export function useTooltipPortalContext() {
  return useContext(TooltipPortalContext);
}
