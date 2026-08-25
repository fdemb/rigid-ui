import { createContext, useContext, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { PhysicalSide } from "../../utils/createAnchorPositioning";
import type { TooltipAlign, TooltipSide } from "../types";

export interface TooltipPositionerContextValue {
  /** The side the popup was actually rendered on, after collision handling. */
  side: Accessor<TooltipSide>;
  /** Same as `side`, resolved to a physical direction (never `inline-start`/`inline-end`). */
  physicalSide: Accessor<PhysicalSide>;
  /** The alignment the popup was actually rendered with, after collision handling. */
  align: Accessor<TooltipAlign>;
  arrowStyles: Accessor<JSX.CSSProperties>;
  arrowUncentered: Accessor<boolean>;
  setArrowElement(element: Element | undefined): void;
  registerViewport(): () => void;
}

export const TooltipPositionerContext = createContext<TooltipPositionerContextValue | null>(null);

export function useTooltipPositionerContext() {
  const context = useContext(TooltipPositionerContext);
  if (!context) {
    throw new Error("Rigid UI: TooltipPositioner parts must be used within <Tooltip.Positioner>.");
  }
  return context;
}
