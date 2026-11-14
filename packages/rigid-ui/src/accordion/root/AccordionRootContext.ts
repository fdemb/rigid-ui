import { createContext, useContext, type Accessor } from "solid-js";
import type { BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails";
import type { REASONS } from "../../internals/reasons";

export type AccordionValue = unknown[];

export interface AccordionRootState {
  /**
   * The current value.
   * Treat it as read-only: it may be shared with the caller's array.
   */
  value: AccordionValue;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * The component orientation.
   *
   * Deprecated following the APG guidance update to remove roving focus.
   * This state no longer affects keyboard focus behavior.
   * @deprecated
   */
  orientation: "horizontal" | "vertical";
}

export type AccordionRootChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;

export type AccordionRootChangeEventDetails =
  BaseUIChangeEventDetails<AccordionRootChangeEventReason>;

export interface AccordionRootContextValue {
  disabled: Accessor<boolean>;
  value: Accessor<AccordionValue>;
  state: Accessor<AccordionRootState>;
  hiddenUntilFound: Accessor<boolean>;
  keepMounted: Accessor<boolean>;
  handleValueChange: (
    newValue: unknown,
    nextOpen: boolean,
    eventDetails: AccordionRootChangeEventDetails,
  ) => void;
  registerItem: () => Accessor<number>;
}

export const AccordionRootContext = createContext<AccordionRootContextValue | null>(null);

export function useAccordionRootContext(optional = false) {
  const context = useContext(AccordionRootContext);
  if (!context && !optional) {
    throw new Error(
      "Base UI: AccordionRootContext is missing. Accordion parts must be placed within <Accordion.Root>.",
    );
  }
  return context;
}
