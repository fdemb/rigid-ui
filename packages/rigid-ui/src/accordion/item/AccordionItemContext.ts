import { createContext, useContext, type Accessor, type Setter } from "solid-js";
import type { AccordionRootState } from "../root/AccordionRootContext";
import type { TransitionStatus } from "../../internals/createTransitionStatus";

export interface AccordionItemState extends AccordionRootState {
  /**
   * Whether the accordion item's panel is currently hidden.
   */
  hidden: boolean;
  /**
   * The item index.
   */
  index: number;
  /**
   * Whether the component is open.
   */
  open: boolean;
}

export interface AccordionItemContextValue {
  open: Accessor<boolean>;
  mounted: Accessor<boolean>;
  transitionStatus: Accessor<TransitionStatus>;
  setMounted: (mounted: boolean) => void;
  state: Accessor<AccordionItemState>;
  defaultTriggerId: string;
  triggerId: Accessor<string | undefined>;
  setTriggerId: Setter<string | null | undefined>;
  defaultPanelId: string;
  panelId: Accessor<string | undefined>;
  setPanelId: Setter<string | null | undefined>;
  disabled: Accessor<boolean>;
  handleTrigger: (event: MouseEvent | KeyboardEvent) => void;
  requestPanelOpen: (open: boolean, event: Event) => void;
}

export const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

export function useAccordionItemContext(optional = false) {
  const context = useContext(AccordionItemContext);
  if (!context && !optional) {
    throw new Error(
      "Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.",
    );
  }
  return context;
}
