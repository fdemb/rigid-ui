import { createContext, useContext, type Accessor } from "solid-js";
import type {
  PopoverAlign,
  PopoverInstantType,
  PopoverInteractionType,
  PopoverRootChangeEventReason,
  PopoverSide,
  PopoverTransitionStatus,
} from "../types";

export interface RegisteredPopoverTrigger<Payload = unknown> {
  id: string;
  element: Accessor<HTMLButtonElement | undefined>;
  payload: Accessor<Payload | undefined>;
  disabled: Accessor<boolean>;
  openOnHover: Accessor<boolean>;
  closeDelay: Accessor<number>;
}

export interface PopoverRootContextValue<Payload = unknown> {
  open: Accessor<boolean>;
  mounted: Accessor<boolean>;
  transitionStatus: Accessor<PopoverTransitionStatus>;
  popupId: string;
  activeTriggerId: Accessor<string | null>;
  activeTrigger: Accessor<RegisteredPopoverTrigger<Payload> | undefined>;
  payload: Accessor<Payload | undefined>;
  modal: Accessor<boolean | "trap-focus">;
  openReason: Accessor<PopoverRootChangeEventReason>;
  openMethod: Accessor<PopoverInteractionType>;
  /**
   * Records how the next open was initiated. A click event does not carry a pointer type, so a
   * trigger has to report what its preceding `pointerdown` saw.
   */
  setOpenMethod(method: PopoverInteractionType): void;
  /** Why transitions should be skipped for the current change, or `undefined` to allow them. */
  instantType: Accessor<PopoverInstantType>;
  setInstantType(value: PopoverInstantType): void;
  titleId: Accessor<string | undefined>;
  descriptionId: Accessor<string | undefined>;
  popupElement: Accessor<HTMLDivElement | undefined>;
  portalElement: Accessor<HTMLDivElement | undefined>;
  positionerElement: Accessor<HTMLDivElement | undefined>;
  closePartCount: Accessor<number>;
  containsTarget(target: Node | null): boolean;
  registerDescendantPortal(element: HTMLElement, open: Accessor<boolean>): () => void;
  registerPortalWithAncestors(element: HTMLElement): () => void;
  registerTrigger(trigger: RegisteredPopoverTrigger<Payload>): () => void;
  registerTitle(id: string): () => void;
  registerDescription(id: string): () => void;
  registerClose(): () => void;
  setPopupElement(element: HTMLDivElement | undefined): void;
  setPortalElement(element: HTMLDivElement | undefined): void;
  setPositionerElement(element: HTMLDivElement | undefined): void;
  requestOpen(
    open: boolean,
    reason: PopoverRootChangeEventReason,
    event?: Event,
    triggerId?: string,
  ): boolean;
  openByTrigger(triggerId: string, reason: PopoverRootChangeEventReason, event?: Event): boolean;
  finishTransition(): void;
  forceUnmount(): void;
  cancelHoverClose(): void;
  scheduleHoverClose(triggerId: string, event: Event, delay: number): void;
  side: Accessor<PopoverSide>;
  align: Accessor<PopoverAlign>;
  setPosition(side: PopoverSide, align: PopoverAlign): void;
}

export const PopoverRootContext = createContext<PopoverRootContextValue<unknown> | null>(null);

export function usePopoverRootContext(optional = false) {
  const context = useContext(PopoverRootContext);
  if (!context && !optional) {
    throw new Error("Rigid UI: Popover parts must be used within <Popover.Root>.");
  }
  return context ?? undefined;
}
