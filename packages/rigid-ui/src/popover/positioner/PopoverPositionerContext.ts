import { createContext, useContext, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { PhysicalSide } from "../../utils/createAnchorPositioning";
import type { PopoverAlign, PopoverSide } from "../types";

export interface PopoverPositionerContextValue {
  /** The side the popup was actually rendered on, after collision handling. */
  side: Accessor<PopoverSide>;
  /** Same as `side`, resolved to a physical direction (never `inline-start`/`inline-end`). */
  physicalSide: Accessor<PhysicalSide>;
  /** The alignment the popup was actually rendered with, after collision handling. */
  align: Accessor<PopoverAlign>;
  arrowStyles: Accessor<JSX.CSSProperties>;
  arrowUncentered: Accessor<boolean>;
  setArrowElement(element: Element | undefined): void;
  hasViewport: Accessor<boolean>;
  registerViewport(): () => void;
}

export const PopoverPositionerContext = createContext<PopoverPositionerContextValue | null>(null);

export function usePopoverPositionerContext() {
  const context = useContext(PopoverPositionerContext);
  if (!context) {
    throw new Error("Rigid UI: this Popover part must be used within <Popover.Positioner>.");
  }
  return context;
}
