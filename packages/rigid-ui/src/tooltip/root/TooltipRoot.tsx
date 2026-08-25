import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  untrack,
} from "solid-js";
import { createComponent, type JSX } from "@solidjs/web";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails";
import { REASONS } from "../../internals/reasons";
import { useTooltipProviderContext } from "../provider/TooltipProviderContext";
import {
  TooltipRootContext,
  type RegisteredTooltipTrigger,
  type TooltipRootContextValue,
  useTooltipRootContext,
} from "./TooltipRootContext";
import type { TooltipHandle } from "../store/TooltipHandle";
import type {
  TooltipInstantType,
  TooltipRootActions,
  TooltipRootChangeEventDetails,
  TooltipRootChangeEventReason,
  TooltipTransitionStatus,
} from "../types";

export interface TooltipRootProps<Payload = unknown> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean, eventDetails: TooltipRootChangeEventDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  actionsRef?: { current: TooltipRootActions | null } | ((actions: TooltipRootActions) => void);
  /** When true, the tooltip cannot be opened and an open one closes. */
  disabled?: boolean;
  /**
   * Whether the tooltip contents can be hovered without closing the tooltip.
   * @default false
   */
  disableHoverablePopup?: boolean;
  triggerId?: string | null;
  defaultTriggerId?: string | null;
  handle?: TooltipHandle<Payload>;
  children?: JSX.Element | ((state: { payload: Payload | undefined }) => JSX.Element);
}

export type TooltipRootState = Record<never, never>;

function animationTime(animation: Animation) {
  const timing = animation.effect?.getComputedTiming();
  return typeof timing?.endTime === "number" ? timing.endTime : 0;
}

/**
 * Classifies a change as one that should not be animated. Focus opens have no motion to wait
 * for, and Escape dismissals should not linger.
 */
function resolveInstantType(
  nextOpen: boolean,
  reason: TooltipRootChangeEventReason,
): TooltipInstantType {
  if (nextOpen && reason === REASONS.triggerFocus) return "focus";
  if (!nextOpen && reason === REASONS.escapeKey) return "dismiss";
  return undefined;
}

export function TooltipRoot<Payload = unknown>(props: TooltipRootProps<Payload>) {
  const provider = useTooltipProviderContext(true);
  const rootId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const popupId = `rigid-tooltip-${rootId}`;
  const initialOpen = untrack(() => !props.disabled && (props.open ?? props.defaultOpen ?? false));
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(
    untrack(() => props.defaultOpen ?? false),
  );
  const [internalTriggerId, setInternalTriggerId] = createSignal<string | null>(
    untrack(() => props.defaultTriggerId ?? null),
  );
  const [mounted, setMounted] = createSignal(initialOpen);
  const [transitionStatus, setTransitionStatus] = createSignal<TooltipTransitionStatus>(
    initialOpen ? "starting" : undefined,
  );
  const [openReason, setOpenReason] = createSignal<TooltipRootChangeEventReason>("none");
  const [instantType, setInstantType] = createSignal<TooltipInstantType>(undefined);
  const [popupElement, setPopupElement] = createSignal<HTMLDivElement>();
  const [portalElement, setPortalElement] = createSignal<HTMLDivElement>();
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement>();

  const triggers = new Map<string, RegisteredTooltipTrigger<Payload>>();
  const [triggerRevision, setTriggerRevision] = createSignal(0);

  // Group registration feeds the instant phase: another member being mounted means this tooltip
  // was reached by moving off a visible sibling, so both changes skip animations. Membership
  // writes no signals, so registering during setup is safe.
  if (provider) {
    const unregisterMember = provider.registerMember(mounted);
    onCleanup(unregisterMember);
  }
  const isInstantPhase = () => {
    const total = provider?.activeMembers() ?? 0;
    return total - (untrack(mounted) ? 1 : 0) > 0;
  };

  const rawOpen = () => (props.open === undefined ? uncontrolledOpen() : props.open);
  const open = () => !props.disabled && rawOpen();
  const activeTriggerId = () =>
    props.triggerId === undefined ? internalTriggerId() : props.triggerId;

  // Synchronous mirror of the open state for imperative decisions made inside event handlers.
  // Signal writes do not become visible to reads until the next flush, so a trigger handling
  // focus followed by click in the same tick would otherwise see the pre-change state and skip
  // its work. Signals stay the reactive source of truth; this mirror only serves non-reactive
  // readers, exactly like the attachment field in PopupHandle.
  const sync: {
    open: boolean;
    reason: TooltipRootChangeEventReason;
    activeTriggerId: string | null;
  } = {
    open: initialOpen,
    reason: REASONS.none,
    activeTriggerId: untrack(activeTriggerId),
  };
  createEffect(
    () => [open(), activeTriggerId()] as const,
    ([isOpen, triggerId]) => {
      sync.open = isOpen;
      sync.activeTriggerId = triggerId;
    },
  );

  const activeTrigger = createMemo(() => {
    triggerRevision();
    const id = activeTriggerId();
    return id == null ? undefined : triggers.get(id);
  });
  const payload = () => activeTrigger()?.payload();

  let hoverCloseTimer: ReturnType<typeof setTimeout> | undefined;
  let completionTimer: ReturnType<typeof setTimeout> | undefined;
  let transitionFrame: number | undefined;
  let transitionGeneration = 0;
  let preventCurrentUnmount = false;
  let lastOpen = initialOpen;

  function cancelScheduledTransition() {
    transitionGeneration += 1;
    if (completionTimer !== undefined) clearTimeout(completionTimer);
    if (transitionFrame !== undefined && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(transitionFrame);
    }
    completionTimer = undefined;
    transitionFrame = undefined;
  }

  function finishTransition(generation = transitionGeneration) {
    if (generation !== transitionGeneration) return;
    if (completionTimer !== undefined) clearTimeout(completionTimer);
    completionTimer = undefined;
    const isOpen = open();
    setTransitionStatus(undefined);
    if (!isOpen && !preventCurrentUnmount) setMounted(false);
    props.onOpenChangeComplete?.(isOpen);
  }

  function waitForAnimations(generation: number) {
    const animations = [popupElement(), positionerElement()]
      .flatMap((element) => element?.getAnimations?.() ?? [])
      .filter((animation, index, all) => all.indexOf(animation) === index);
    if (animations.length === 0) {
      queueMicrotask(() => finishTransition(generation));
      return;
    }
    const maximumTime = Math.max(...animations.map(animationTime), 0);
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() =>
      finishTransition(generation),
    );
    completionTimer = setTimeout(() => finishTransition(generation), maximumTime + 100);
  }

  function scheduleTransitionCompletion(isEntering: boolean) {
    cancelScheduledTransition();
    const generation = transitionGeneration;
    const observe = () => {
      transitionFrame = undefined;
      waitForAnimations(generation);
    };
    const begin = () => {
      transitionFrame = undefined;
      if (isEntering) setTransitionStatus(undefined);
      if (typeof requestAnimationFrame === "undefined") observe();
      else transitionFrame = requestAnimationFrame(observe);
    };
    if (typeof requestAnimationFrame === "undefined") begin();
    else transitionFrame = requestAnimationFrame(begin);
  }

  function requestOpen(
    nextOpen: boolean,
    reason: TooltipRootChangeEventReason,
    event = new Event("base-ui"),
    triggerId?: string,
  ) {
    if (props.disabled && nextOpen) return false;
    const proposedTrigger = triggerId === undefined ? activeTrigger() : triggers.get(triggerId);
    const details = createChangeEventDetails(reason, event, proposedTrigger?.element(), {
      preventUnmountOnClose() {
        preventCurrentUnmount = true;
      },
    });
    preventCurrentUnmount = false;
    props.onOpenChange?.(nextOpen, details);
    if (details.isCanceled) return false;

    if (triggerId !== undefined && props.triggerId === undefined) {
      setInternalTriggerId(triggerId);
      sync.activeTriggerId = triggerId;
    }
    sync.open = props.open === undefined ? !props.disabled && nextOpen : open();
    sync.reason = reason;
    setOpenReason(reason);
    setInstantType(resolveInstantType(nextOpen, reason));
    if (props.open === undefined) setUncontrolledOpen(nextOpen);
    return true;
  }

  function openByTrigger(triggerId: string, reason: TooltipRootChangeEventReason, event?: Event) {
    if (!triggers.has(triggerId)) {
      throw new Error(`Rigid UI: Tooltip trigger with id "${triggerId}" is not registered.`);
    }
    return requestOpen(true, reason, event, triggerId);
  }

  function registerTrigger(trigger: RegisteredTooltipTrigger<Payload>) {
    triggers.set(trigger.id, trigger);
    setTriggerRevision((revision) => revision + 1);
    if (untrack(() => open() && activeTriggerId() == null && props.triggerId === undefined)) {
      setInternalTriggerId(trigger.id);
    }
    return () => {
      if (triggers.get(trigger.id) !== trigger) return;
      triggers.delete(trigger.id);
      setTriggerRevision((revision) => revision + 1);
    };
  }

  function cancelHoverClose() {
    if (hoverCloseTimer !== undefined) clearTimeout(hoverCloseTimer);
    hoverCloseTimer = undefined;
  }

  function isInsideOtherTrigger(target: EventTarget | null, excludeId: string) {
    if (!(target instanceof Element)) return false;
    for (const trigger of triggers.values()) {
      if (trigger.id === excludeId || trigger.disabled()) continue;
      const element = untrack(trigger.element);
      if (element && (element === target || element.contains(target))) return true;
    }
    return false;
  }

  function scheduleHoverClose(triggerId: string, event: Event, delay: number) {
    cancelHoverClose();
    if (sync.activeTriggerId !== triggerId) return;
    hoverCloseTimer = setTimeout(() => {
      if (sync.activeTriggerId !== triggerId) return;
      // When a sibling tooltip in the same provider group took over, this close is a
      // displacement rather than a plain unhover, so it plays out instantly like Base UI's
      // delay-group closes (reason `none`).
      requestOpen(false, isInstantPhase() ? REASONS.none : REASONS.triggerHover, event, triggerId);
    }, delay);
  }

  const context: TooltipRootContextValue<Payload> = {
    open,
    readState: () => sync,
    mounted,
    transitionStatus,
    popupId,
    activeTriggerId,
    activeTrigger,
    payload,
    disabled: () => props.disabled ?? false,
    disableHoverablePopup: () => props.disableHoverablePopup ?? false,
    openReason,
    instantType,
    setInstantType,
    isInstantPhase,
    popupElement,
    portalElement,
    positionerElement,
    registerTrigger,
    isInsideOtherTrigger,
    setPopupElement,
    setPortalElement,
    setPositionerElement,
    requestOpen,
    openByTrigger,
    finishTransition,
    forceUnmount() {
      preventCurrentUnmount = false;
      setMounted(false);
      setTransitionStatus(undefined);
    },
    cancelHoverClose,
    scheduleHoverClose,
  };

  createEffect(
    () => [open(), mounted()] as const,
    ([isOpen, isMounted]) => {
      if (isOpen === lastOpen && !(isOpen && !isMounted)) return;
      lastOpen = isOpen;
      if (isOpen) {
        preventCurrentUnmount = false;
        setMounted(true);
        setTransitionStatus("starting");
      } else if (isMounted) {
        setTransitionStatus("ending");
      }
      scheduleTransitionCompletion(isOpen);
    },
  );

  // Instant-phase choreography, ported from Base UI's TooltipRoot: a sibling in the same
  // provider group opening makes this tooltip switch without animation, and a close caused by
  // that sibling (reason `none`) ends instantly too. Any other change plays its animation.
  createEffect(
    () => [transitionStatus(), isInstantPhase(), openReason(), instantType()] as const,
    ([status, instantPhase, reason, current]) => {
      if (
        (status === "ending" && reason === REASONS.none) ||
        (status !== "ending" && instantPhase)
      ) {
        setInstantType("delay");
      } else if (current === "delay") {
        setInstantType(undefined);
      }
    },
  );

  createEffect(
    () => [props.disabled ?? false, rawOpen()] as const,
    ([isDisabled, isOpen]) => {
      if (isDisabled && isOpen) {
        untrack(() => requestOpen(false, REASONS.disabled));
      }
    },
  );

  createEffect(
    () => open(),
    (isOpen) => {
      if (!isOpen) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        requestOpen(false, REASONS.escapeKey, event);
      };
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    },
  );

  createEffect(
    () => props.handle,
    (handle) => handle?.attach(context),
  );
  createEffect(
    () => props.actionsRef,
    (actionsRef) => {
      const actions: TooltipRootActions = {
        unmount() {
          context.forceUnmount();
        },
        close() {
          requestOpen(false, REASONS.imperativeAction);
        },
      };
      if (typeof actionsRef === "function") actionsRef(actions);
      else if (actionsRef) actionsRef.current = actions;
      return () => {
        if (actionsRef && typeof actionsRef !== "function") actionsRef.current = null;
      };
    },
  );
  if (initialOpen) scheduleTransitionCompletion(true);
  onCleanup(() => {
    cancelHoverClose();
    cancelScheduledTransition();
  });

  // The payload render prop is a component, so it is created like one: `createComponent` invokes
  // it once with a reactive props object instead of re-running it as a computation.
  const payloadProps = {
    get payload() {
      return payload();
    },
  };
  const children = () => {
    const value = props.children;
    return typeof value === "function" ? createComponent(value, payloadProps) : value;
  };

  return <TooltipRootContext value={context}>{children()}</TooltipRootContext>;
}

export namespace TooltipRoot {
  export type State = TooltipRootState;
  export type Props<Payload = unknown> = TooltipRootProps<Payload>;
  export type Actions = TooltipRootActions;
  export type ChangeEventReason = TooltipRootChangeEventReason;
  export type ChangeEventDetails = TooltipRootChangeEventDetails;
}

// Re-exported so parts can import the guard without reaching into the context module.
export { useTooltipRootContext };
