import { createContext, useContext, type Accessor } from "solid-js";
import type { PopoverAlign, PopoverSide } from "../types";

export interface PopoverPositionerContextValue {
  side: Accessor<PopoverSide>;
  align: Accessor<PopoverAlign>;
  arrowOffset: Accessor<{ x: number; y: number }>;
}

export const PopoverPositionerContext = createContext<PopoverPositionerContextValue | null>(null);

export function usePopoverPositionerContext() {
  const context = useContext(PopoverPositionerContext);
  if (!context) {
    throw new Error("Rigid UI: this Popover part must be used within <Popover.Positioner>.");
  }
  return context;
}
