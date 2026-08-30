import type { Accessor } from "solid-js";
import type { TooltipRootContextValue } from "../root/TooltipRootContext";
import { REASONS } from "../../internals/reasons";
import { contains } from "../../utils/contains";
import { getTargetElement } from "../../utils/getTarget";
import { isMouseLikePointerType } from "../../utils/pointerType";
import { useTimeout } from "../../utils/useTimeout";

const TOOLTIP_TRIGGER_IDENTIFIER = "data-rigid-ui-tooltip-trigger";

interface NestedHoverState {
  nestedTriggerHovered: boolean;
  /** Local copy, cleared on mouseleave so it cannot outlive the hover it describes. */
  pointerType: string | undefined;
}

export interface TooltipTriggerInteractionProps {
  onPointerEnter(event: PointerEvent): void;
  onPointerLeave(event: PointerEvent): void;
  onPointerDown(event: PointerEvent): void;
  onMouseEnter(event: MouseEvent): void;
  onMouseLeave(): void;
  onMouseOver(event: MouseEvent): void;
  onMouseMove(event: MouseEvent): void;
  onFocus(event: FocusEvent): void;
  onBlur(event: FocusEvent): void;
  onClick(event: MouseEvent): void;
  readonly [TOOLTIP_TRIGGER_IDENTIFIER]: string | undefined;
}

export interface CreateTooltipTriggerInteractionsParams<Payload> {
  id: Accessor<string>;
  element: Accessor<HTMLButtonElement | undefined>;
  context: Accessor<TooltipRootContextValue<Payload> | undefined>;
  disabled: Accessor<boolean>;
  openDelay: Accessor<number>;
  closeDelay: Accessor<number>;
  closeOnClick: Accessor<boolean>;
}

function closestEnabledTooltipTrigger(element: Element | null): Element | null {
  let current = element;
  while (current) {
    const trigger = current.closest(`[${TOOLTIP_TRIGGER_IDENTIFIER}]`);
    if (trigger) return trigger;

    const root = current.getRootNode();
    current = root instanceof ShadowRoot && root.host instanceof Element ? root.host : null;
  }
  return null;
}

/**
 * Owns every interaction policy of a tooltip trigger: hover, nested-trigger choreography, focus,
 * and press. All of it sits behind a single props bag, so the pending-open timeout has one owner
 * and no caller has to remember to cancel it. That one timeout covers both the ordinary and the
 * nested-trigger open, so a transition between those paths cannot leave a stale open behind.
 *
 * Nested-trigger detection runs on `mouseover` only, as it does in Base UI: that is the event
 * that fires on every element crossing, and it is the one whose handler performs the handover.
 */
export function createTooltipTriggerInteractions<Payload>(
  params: CreateTooltipTriggerInteractionsParams<Payload>,
): TooltipTriggerInteractionProps {
  const openTimeout = useTimeout();
  const nestedHover: NestedHoverState = {
    nestedTriggerHovered: false,
    pointerType: undefined,
  };
  // Set between pointerdown and click so the focus event a press generates is not mistaken for
  // keyboard focus; only real keyboard focus should open the tooltip instantly.
  let sawPointerDown = false;

  // Synchronous mirror of "this trigger owns the open tooltip", for decisions inside handlers,
  // where signal writes from a sibling handler in the same tick (focus opening before click) are
  // not visible yet.
  const openByThisTriggerSync = () => {
    const store = params.context();
    if (!store) return false;
    const snapshot = store.readState();
    return snapshot.open && snapshot.activeTriggerId === params.id();
  };

  function isEnabledNestedTriggerTarget(target: Element | null) {
    const triggerElement = params.element();
    if (!triggerElement || !target) return false;

    const nearestTrigger = closestEnabledTooltipTrigger(target);
    return (
      nearestTrigger !== null &&
      nearestTrigger !== triggerElement &&
      contains(triggerElement, nearestTrigger)
    );
  }

  function handleNestedTriggerHover(event: MouseEvent) {
    const wasNestedTriggerHovered = nestedHover.nestedTriggerHovered;
    const target = getTargetElement(event);
    const nestedTriggerHovered = isEnabledNestedTriggerTarget(target);
    nestedHover.nestedTriggerHovered = nestedTriggerHovered;
    if (nestedTriggerHovered) openTimeout.clear();
    const triggerElement = params.element();
    const targetInsideTrigger =
      triggerElement !== undefined && target !== null && contains(triggerElement, target);
    const store = params.context();
    const snapshot = store?.readState();

    // Hovering a nested trigger hands the tooltip over: this one closes so the inner one can open.
    if (
      nestedTriggerHovered &&
      store !== undefined &&
      snapshot?.open === true &&
      snapshot.reason === REASONS.triggerHover
    ) {
      store.cancelHoverClose();
      store.requestOpen(false, REASONS.triggerHover, event, params.id());
      return;
    }

    // Leaving the nested trigger back into this one reopens after the ordinary delay.
    if (
      wasNestedTriggerHovered &&
      !nestedTriggerHovered &&
      targetInsideTrigger &&
      !params.disabled() &&
      snapshot?.open === false &&
      isMouseLikePointerType(nestedHover.pointerType)
    ) {
      const open = () => {
        const latestStore = params.context();
        if (
          !nestedHover.nestedTriggerHovered &&
          !params.disabled() &&
          latestStore?.readState().open === false &&
          triggerElement
        ) {
          latestStore.openByTrigger(params.id(), REASONS.triggerHover, event);
        }
      };
      const openDelay = params.openDelay();
      if (openDelay === 0) open();
      else openTimeout.start(openDelay, open);
    }
  }

  // The user's handlers are chained ahead of these by renderPart; these only observe
  // defaultPrevented.
  return {
    onPointerEnter(event) {
      nestedHover.pointerType = event.pointerType;
      if (event.defaultPrevented || params.disabled() || event.pointerType === "touch") return;
      const store = params.context();
      store?.cursorTracking.observeCursor(params.id(), event);
      if (!store || store.readState().open || nestedHover.nestedTriggerHovered) return;
      openTimeout.start(params.openDelay(), () => {
        const latestStore = params.context();
        if (!latestStore || params.disabled() || nestedHover.nestedTriggerHovered) return;
        latestStore.openByTrigger(params.id(), REASONS.triggerHover, event);
      });
    },
    onPointerLeave(event) {
      openTimeout.clear();
      const store = params.context();
      if (!store || !openByThisTriggerSync()) return;
      store.scheduleHoverClose(params.id(), event, params.closeDelay());
    },
    onPointerDown(event) {
      nestedHover.pointerType = event.pointerType;
      sawPointerDown = true;
      const store = params.context();
      store?.cursorTracking.observeCursor(params.id(), event);
      // A press means deliberate interaction; a pending hover reveal would fight it.
      if (store && !store.open()) openTimeout.clear();
    },
    onMouseEnter(event) {
      if (event.defaultPrevented || params.disabled()) return;
      params.context()?.cursorTracking.observeCursor(params.id(), event);
    },
    onMouseLeave() {
      nestedHover.nestedTriggerHovered = false;
      nestedHover.pointerType = undefined;
      openTimeout.clear();
    },
    onMouseOver(event) {
      if (event.defaultPrevented || params.disabled()) return;
      handleNestedTriggerHover(event);
    },
    onMouseMove(event) {
      if (event.defaultPrevented || params.disabled()) return;
      params.context()?.cursorTracking.observeCursor(params.id(), event);
    },
    onFocus(event) {
      if (
        event.defaultPrevented ||
        params.disabled() ||
        sawPointerDown ||
        isEnabledNestedTriggerTarget(getTargetElement(event))
      ) {
        return;
      }
      const store = params.context();
      if (!store) return;
      // Focus landing on a different trigger hands the open tooltip over instead of being
      // ignored; Base UI's focus handling reaches the same outcome through its open timers.
      const snapshot = store.readState();
      if (snapshot.open && snapshot.activeTriggerId === params.id()) return;
      openTimeout.clear();
      // Focus opens skip the rest delay: keyboard users should not wait out a hover timer that
      // was tuned for pointers.
      store.openByTrigger(params.id(), REASONS.triggerFocus, event);
    },
    onBlur(event) {
      if (event.defaultPrevented) return;
      openTimeout.clear();
      const store = params.context();
      if (!store || !openByThisTriggerSync()) return;
      if (store.openReason() === REASONS.triggerHover) return;
      // The focus handler of the trigger gaining focus performs the handover; closing here
      // would tear the popup down mid-switch.
      if (store.isInsideOtherTrigger(event.relatedTarget, params.id())) return;
      store.requestOpen(false, REASONS.triggerFocus, event, params.id());
    },
    onClick(event) {
      sawPointerDown = false;
      if (event.defaultPrevented || params.disabled()) return;
      openTimeout.clear();
      const store = params.context();
      if (!store) return;
      if (params.closeOnClick() && openByThisTriggerSync()) {
        store.requestOpen(false, REASONS.triggerPress, event, params.id());
      }
    },
    get [TOOLTIP_TRIGGER_IDENTIFIER]() {
      return params.disabled() ? undefined : "";
    },
  };
}
