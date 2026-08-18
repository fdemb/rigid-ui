import { createContext, useContext } from "solid-js";

export const PopoverPortalContext = createContext<boolean | null>(null);

export function usePopoverPortalContext() {
  return useContext(PopoverPortalContext);
}
