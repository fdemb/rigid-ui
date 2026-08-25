import { createContext, useContext, type Accessor } from "solid-js";
import type {
  TooltipInstantType,
  TooltipRootChangeEventDetails,
  TooltipRootChangeEventReason,
  TooltipSide,
  TooltipTransitionStatus,
} from "../types";

export interface RegisteredTooltipTrigger<Payload = unknown> {
  id: string;
  element: Accessor<HTMLButtonElement | undefined>;
  payload: Accessor<Payload | undefined>;
  disabled: Accessor<boolean>;
  closeOnClick: Accessor<boolean>;
  closeDelay: Accessor<number>;
}

export interface TooltipSyncState {
  /** Mirrors `open` for synchronous reads inside event handlers. */
  open: boolean;
  reason: TooltipRootChangeEventReason;
  activeTriggerId: string | null;
}

export interface TooltipRootContextValue<Payload = unknown> {
  open: Accessor<boolean>;
  /**
   * Synchronous view of the state for imperative decisions inside event handlers, where signal
   * writes from an earlier handler in the same tick are not visible yet.
   */
  readState(): TooltipSyncState;
  mounted: Accessor<boolean>;
  transitionStatus: Accessor<TooltipTransitionStatus>;
  popupId: string;
  activeTriggerId: Accessor<string | null>;
  activeTrigger: Accessor<RegisteredTooltipTrigger<Payload> | undefined>;
  payload: Accessor<Payload | undefined>;
  disabled: Accessor<boolean>;
  disableHoverablePopup: Accessor<boolean>;
  openReason: Accessor<TooltipRootChangeEventReason>;
  /** Why transitions should be skipped for the current change, or `undefined` to allow them. */
  instantType: Accessor<TooltipInstantType>;
  setInstantType(value: TooltipInstantType): void;
  /**
   * True while another tooltip in the same provider group is visible: this tooltip must open
   * without its rest delay and skip animations.
   */
  isInstantPhase: Accessor<boolean>;
  popupElement: Accessor<HTMLDivElement | undefined>;
  portalElement: Accessor<HTMLDivElement | undefined>;
  positionerElement: Accessor<HTMLDivElement | undefined>;
  registerTrigger(trigger: RegisteredTooltipTrigger<Payload>): () => void;
  /**
   * True when `target` sits inside a registered, enabled trigger other than `excludeId`. Focus
   * handlers use this to hand an already-open tooltip over to the trigger gaining focus.
   */
  isInsideOtherTrigger(target: EventTarget | null, excludeId: string): boolean;
  setPopupElement(element: HTMLDivElement | undefined): void;
  setPortalElement(element: HTMLDivElement | undefined): void;
  setPositionerElement(element: HTMLDivElement | undefined): void;
  requestOpen(
    open: boolean,
    reason: TooltipRootChangeEventReason,
    event?: Event,
    triggerId?: string,
  ): boolean;
  openByTrigger(triggerId: string, reason: TooltipRootChangeEventReason, event?: Event): boolean;
  finishTransition(): void;
  forceUnmount(): void;
  cancelHoverClose(): void;
  scheduleHoverClose(triggerId: string, event: Event, delay: number): void;
}

export const TooltipRootContext = createContext<TooltipRootContextValue<unknown> | null>(null);

export function useTooltipRootContext(optional = false) {
  const context = useContext(TooltipRootContext);
  if (!context && !optional) {
    throw new Error("Rigid UI: Tooltip parts must be used within <Tooltip.Root>.");
  }
  return context ?? undefined;
}

export type { TooltipRootChangeEventDetails };
export type { TooltipSide };
