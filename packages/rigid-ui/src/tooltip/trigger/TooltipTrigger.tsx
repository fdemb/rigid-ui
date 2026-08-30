import { createEffect, createSignal, createUniqueId, onCleanup, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { TooltipHandle } from "../store/TooltipHandle";
import { useTooltipProviderContext } from "../provider/TooltipProviderContext";
import {
  useTooltipRootContext,
  type RegisteredTooltipTrigger,
  type TooltipRootContextValue,
} from "../root/TooltipRootContext";
import { renderPart } from "../../internals/renderPart";
import { REASONS } from "../../internals/reasons";
import { triggerOpenStateMapping } from "../../utils/popupStateMapping";
import { contains } from "../../utils/contains";
import { OPEN_DELAY } from "../utils/constants";
import type { TooltipNativeProps } from "../types";

const TOOLTIP_TRIGGER_IDENTIFIER = "data-rigid-ui-tooltip-trigger";

interface NestedHoverState {
  nestedTriggerHovered: boolean;
  pointerType: string | undefined;
}

function getTargetElement(event: Event): Element | null {
  if (typeof event.composedPath === "function") {
    for (const target of event.composedPath()) {
      if (target instanceof Element) return target;
    }
  }
  return event.target instanceof Element ? event.target : null;
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

function isMouseLikePointerType(pointerType: string | undefined) {
  return (
    pointerType === undefined ||
    pointerType === "" ||
    pointerType === "mouse" ||
    pointerType === "pen"
  );
}

export interface TooltipTriggerState {
  /** Whether the tooltip is currently open and was opened by this trigger. */
  open: boolean;
}

export interface TooltipTriggerProps<Payload = unknown> extends TooltipNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  TooltipTriggerState
> {
  handle?: TooltipHandle<Payload>;
  payload?: Payload;
  /**
   * How long to wait before opening the tooltip on hover, in milliseconds.
   * @default 600
   */
  delay?: number;
  /** Whether the tooltip closes when this trigger is clicked. @default true */
  closeOnClick?: boolean;
  /** How long to wait before closing after the pointer leaves, in milliseconds. @default 0 */
  closeDelay?: number;
  /**
   * If true, the tooltip will not open from this trigger. This does not apply the native
   * `disabled` attribute; pass it to the element returned by `render` to disable the element.
   * @default false
   */
  disabled?: boolean;
}

export function TooltipTrigger<Payload = unknown>(props: TooltipTriggerProps<Payload>) {
  const localContext = useTooltipRootContext(true) as TooltipRootContextValue<Payload> | undefined;
  if (!localContext && !untrack(() => props.handle)) {
    throw new Error(
      "Rigid UI: <Tooltip.Trigger> must be used within <Tooltip.Root> or receive a handle.",
    );
  }
  const provider = useTooltipProviderContext(true);

  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-tooltip-trigger-${generatedId}`;
  const context = () => localContext ?? props.handle?.context();
  const disabled = () => props.disabled ?? context()?.disabled() ?? false;
  const [element, setElement] = createSignal<HTMLButtonElement>();
  // Reactive view for rendered attributes…
  const openByThisTrigger = () => {
    const store = context();
    return store?.open() === true && store.activeTriggerId() === id();
  };
  // …and the synchronous mirror for decisions inside handlers, where signal writes from a
  // sibling handler in the same tick (focus opening before click) are not visible yet.
  const openByThisTriggerSync = () => {
    const store = context();
    if (!store) return false;
    const snapshot = store.readState();
    return snapshot.open && snapshot.activeTriggerId === id();
  };

  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let nestedOpenTimer: ReturnType<typeof setTimeout> | undefined;
  const nestedHover: NestedHoverState = {
    nestedTriggerHovered: false,
    pointerType: undefined,
  };
  // Set between pointerdown and click so the focus event a press generates is not mistaken for
  // keyboard focus; only real keyboard focus should open the tooltip instantly.
  let sawPointerDown = false;

  createEffect(
    () => [context(), id()] as const,
    ([store, triggerId]) => {
      if (!store) return;
      const registration: RegisteredTooltipTrigger<Payload> = {
        id: triggerId,
        element,
        payload: () => props.payload,
        disabled,
        closeOnClick: () => props.closeOnClick ?? true,
        closeDelay: () => resolvedCloseDelay(),
      };
      return store.registerTrigger(registration);
    },
  );

  onCleanup(() => {
    clearTimeout(openTimer);
    clearTimeout(nestedOpenTimer);
  });

  const resolvedCloseDelay = () => props.closeDelay ?? provider?.closeDelay ?? 0;
  const resolvedOpenDelay = (): number => {
    // Adjacent tooltips in a provider group open instantly while one is already visible.
    if (context()?.isInstantPhase()) return 0;
    return props.delay ?? provider?.delay ?? OPEN_DELAY;
  };

  function cancelPendingOpen() {
    clearTimeout(openTimer);
    openTimer = undefined;
  }

  function isEnabledNestedTriggerTarget(target: Element | null) {
    const triggerElement = element();
    if (!triggerElement || !target) return false;

    const nearestTrigger = closestEnabledTooltipTrigger(target);
    return (
      nearestTrigger !== null &&
      nearestTrigger !== triggerElement &&
      contains(triggerElement, nearestTrigger)
    );
  }

  function detectNestedTriggerHover(target: Element | null) {
    const nestedTriggerHovered = isEnabledNestedTriggerTarget(target);
    nestedHover.nestedTriggerHovered = nestedTriggerHovered;
    if (nestedTriggerHovered) {
      cancelPendingOpen();
      clearTimeout(nestedOpenTimer);
      nestedOpenTimer = undefined;
    }
    return nestedTriggerHovered;
  }

  function handleNestedTriggerHover(event: MouseEvent) {
    const wasNestedTriggerHovered = nestedHover.nestedTriggerHovered;
    const nestedTriggerHovered = detectNestedTriggerHover(getTargetElement(event));
    const triggerElement = element();
    const target = getTargetElement(event);
    const targetInsideTrigger =
      triggerElement !== undefined && target !== null && contains(triggerElement, target);
    const store = context();

    if (
      nestedTriggerHovered &&
      store?.readState().open === true &&
      store.readState().reason === REASONS.triggerHover
    ) {
      store.cancelHoverClose();
      store.requestOpen(false, REASONS.triggerHover, event, id());
      return;
    }

    if (
      wasNestedTriggerHovered &&
      !nestedTriggerHovered &&
      targetInsideTrigger &&
      !disabled() &&
      store?.readState().open === false &&
      isMouseLikePointerType(nestedHover.pointerType)
    ) {
      const open = () => {
        nestedOpenTimer = undefined;
        const latestStore = context();
        if (
          !nestedHover.nestedTriggerHovered &&
          !disabled() &&
          latestStore?.readState().open === false &&
          triggerElement
        ) {
          latestStore.openByTrigger(id(), REASONS.triggerHover, event);
        }
      };
      const openDelay = resolvedOpenDelay();
      clearTimeout(nestedOpenTimer);
      if (openDelay === 0) open();
      else nestedOpenTimer = setTimeout(open, openDelay);
    }
  }

  // The user's handlers are chained ahead of these by renderPart; the internal handlers only
  // observe defaultPrevented.
  const internalProps = {
    type: "button",
    get id() {
      return id();
    },
    get "data-trigger-disabled"() {
      return disabled() ? "" : undefined;
    },
    onPointerEnter(event: PointerEvent) {
      nestedHover.pointerType = event.pointerType;
      if (event.defaultPrevented || disabled() || event.pointerType === "touch") return;
      const store = context();
      store?.cursorTracking.observeCursor(id(), event);
      if (!store || store.readState().open || nestedHover.nestedTriggerHovered) return;
      cancelPendingOpen();
      openTimer = setTimeout(() => {
        const latestStore = context();
        if (!latestStore || disabled() || nestedHover.nestedTriggerHovered) return;
        latestStore.openByTrigger(id(), REASONS.triggerHover, event);
      }, resolvedOpenDelay());
    },
    onPointerLeave(event: PointerEvent) {
      cancelPendingOpen();
      const store = context();
      if (!store || !openByThisTriggerSync()) return;
      store.scheduleHoverClose(id(), event, resolvedCloseDelay());
    },
    onMouseLeave() {
      nestedHover.nestedTriggerHovered = false;
      clearTimeout(nestedOpenTimer);
      nestedOpenTimer = undefined;
      nestedHover.pointerType = undefined;
    },
    onFocus(event: FocusEvent) {
      if (
        event.defaultPrevented ||
        disabled() ||
        sawPointerDown ||
        isEnabledNestedTriggerTarget(getTargetElement(event))
      ) {
        return;
      }
      const store = context();
      if (!store) return;
      // Focus landing on a different trigger hands the open tooltip over instead of being
      // ignored; Base UI's focus handling reaches the same outcome through its open timers.
      const snapshot = store.readState();
      if (snapshot.open && snapshot.activeTriggerId === id()) return;
      cancelPendingOpen();
      // Focus opens skip the rest delay: keyboard users should not wait out a hover timer that
      // was tuned for pointers.
      store.openByTrigger(id(), REASONS.triggerFocus, event);
    },
    onBlur(event: FocusEvent) {
      if (event.defaultPrevented) return;
      cancelPendingOpen();
      const store = context();
      if (!store || !openByThisTriggerSync()) return;
      if (store.openReason() === REASONS.triggerHover) return;
      // The focus handler of the trigger gaining focus performs the handover; closing here
      // would tear the popup down mid-switch.
      if (store.isInsideOtherTrigger(event.relatedTarget, id())) return;
      store.requestOpen(false, REASONS.triggerFocus, event, id());
    },
    onPointerDown(event: PointerEvent) {
      nestedHover.pointerType = event.pointerType;
      sawPointerDown = true;
      const store = context();
      store?.cursorTracking.observeCursor(id(), event);
      // A press means deliberate interaction; a pending hover reveal would fight it.
      if (store && !store.open()) cancelPendingOpen();
    },
    onMouseEnter(event: MouseEvent) {
      if (event.defaultPrevented || disabled()) return;
      context()?.cursorTracking.observeCursor(id(), event);
    },
    onMouseOver(event: MouseEvent) {
      if (event.defaultPrevented || disabled()) return;
      handleNestedTriggerHover(event);
    },
    onMouseMove(event: MouseEvent) {
      if (event.defaultPrevented || disabled()) return;
      if (isEnabledNestedTriggerTarget(getTargetElement(event))) {
        detectNestedTriggerHover(getTargetElement(event));
      }
      context()?.cursorTracking.observeCursor(id(), event);
    },
    get [TOOLTIP_TRIGGER_IDENTIFIER]() {
      return disabled() ? undefined : "";
    },
    onClick(event: MouseEvent) {
      sawPointerDown = false;
      if (event.defaultPrevented || disabled()) return;
      cancelPendingOpen();
      const store = context();
      if (!store) return;
      if (props.closeOnClick ?? true) {
        if (openByThisTriggerSync()) {
          store.requestOpen(false, REASONS.triggerPress, event, id());
        }
      }
    },
  };

  return renderPart<HTMLButtonElement, TooltipTriggerState>("button", props, {
    props: [internalProps],
    state: () => ({ open: openByThisTrigger() }),
    stateAttributesMapping: triggerOpenStateMapping,
    ref: setElement,
    exclude: ["payload", "handle", "delay", "closeDelay", "closeOnClick", "disabled", "id"],
  });
}

export namespace TooltipTrigger {
  export type State = TooltipTriggerState;
  export type Props<Payload = unknown> = TooltipTriggerProps<Payload>;
}
