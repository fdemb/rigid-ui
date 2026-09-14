import { createSignal, createUniqueId, untrack, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import { createTransitionStatus } from "../../internals/createTransitionStatus";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails";
import { REASONS } from "../../internals/reasons";
import { useAccordionRootContext } from "../root/AccordionRootContext";
import {
  AccordionItemContext,
  type AccordionItemContextValue,
  type AccordionItemState,
} from "./AccordionItemContext";
import { accordionStateAttributesMapping } from "./stateAttributesMapping";
import type { AccordionItemChangeEventDetails } from "./AccordionItemChangeEventDetails";

export interface AccordionItemProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  AccordionItemState
> {
  /**
   * A unique value that identifies this accordion item.
   * If no value is provided, a unique ID will be generated automatically.
   * Use when controlling the accordion programmatically, or to set an initial
   * open state.
   */
  value?: unknown;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Event handler called when the panel is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: AccordionItemChangeEventDetails) => void)
    | undefined;
}

export function AccordionItem(props: AccordionItemProps) {
  const rootContext = useAccordionRootContext();
  const index = rootContext!.registerItem();

  const fallbackValue = createUniqueId();
  const itemValue = () => (props.value ?? fallbackValue) as unknown;

  const disabled = () => (props.disabled ?? false) || rootContext!.disabled();
  const open = () => rootContext!.value().indexOf(itemValue()) !== -1;

  // Read outside a tracking scope: the transition lifecycle owns its own subscriptions from here.
  const { mounted, setMounted, transitionStatus } = untrack(() =>
    createTransitionStatus(open, {
      enableIdleState: true,
    }),
  );

  function handleTrigger(event: MouseEvent | KeyboardEvent) {
    if (disabled()) {
      return;
    }
    const nextOpen = !open();
    const eventDetails = createChangeEventDetails(REASONS.triggerPress, event);
    props.onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    rootContext!.handleValueChange(itemValue(), nextOpen, eventDetails);
  }

  function requestPanelOpen(nextOpen: boolean, event: Event) {
    const eventDetails = createChangeEventDetails(REASONS.none, event);
    props.onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    rootContext!.handleValueChange(itemValue(), nextOpen, eventDetails);
  }

  const state: Accessor<AccordionItemState> = () => ({
    ...rootContext!.state(),
    hidden: !open() && !mounted(),
    index: index(),
    disabled: disabled(),
    open: open(),
  });

  const defaultTriggerId = `rigid-accordion-trigger-${createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [registeredTriggerId, setTriggerId] = createSignal<string | null | undefined>(undefined);
  const triggerId = () => {
    const registered = registeredTriggerId();
    return registered === null ? undefined : (registered ?? defaultTriggerId);
  };

  const defaultPanelId = `rigid-accordion-panel-${createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [registeredPanelId, setPanelId] = createSignal<string | null | undefined>(undefined);
  const panelId = () => {
    const registered = registeredPanelId();
    return registered === null ? undefined : (registered ?? defaultPanelId);
  };

  const itemContext: AccordionItemContextValue = {
    open,
    mounted,
    transitionStatus,
    setMounted,
    state,
    defaultTriggerId,
    triggerId,
    setTriggerId,
    defaultPanelId,
    panelId,
    setPanelId,
    disabled,
    handleTrigger,
    requestPanelOpen,
  };

  return (
    <AccordionItemContext value={itemContext}>
      {renderPart<HTMLDivElement, AccordionItemState>("div", props, {
        state,
        stateAttributesMapping: accordionStateAttributesMapping,
        exclude: ["value", "disabled", "onOpenChange"],
      })}
    </AccordionItemContext>
  );
}

export namespace AccordionItem {
  export type State = AccordionItemState;
  export type Props = AccordionItemProps;
  export type ChangeEventReason = AccordionItemChangeEventDetails["reason"];
  export type ChangeEventDetails = AccordionItemChangeEventDetails;
}
