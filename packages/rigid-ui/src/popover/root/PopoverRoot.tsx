import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  untrack,
} from "solid-js";
import { createComponent, type JSX } from "@solidjs/web";
import {
  PopoverRootContext,
  type PopoverRootContextValue,
  type RegisteredPopoverTrigger,
  usePopoverRootContext,
} from "./PopoverRootContext";
import type { PopoverHandle } from "../store/PopoverHandle";
import type {
  PopoverAlign,
  PopoverInstantType,
  PopoverInteractionType,
  PopoverRootActions,
  PopoverRootChangeEventDetails,
  PopoverRootChangeEventReason,
  PopoverSide,
  PopoverTransitionStatus,
} from "../types";

export interface PopoverRootProps<Payload = unknown> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean, eventDetails: PopoverRootChangeEventDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  actionsRef?: { current: PopoverRootActions | null } | ((actions: PopoverRootActions) => void);
  modal?: boolean | "trap-focus";
  triggerId?: string | null;
  defaultTriggerId?: string | null;
  handle?: PopoverHandle<Payload>;
  children?: JSX.Element | ((state: { payload: Payload | undefined }) => JSX.Element);
}

export type PopoverRootState = Record<never, never>;

const modalStack: Array<{ portal: () => HTMLElement | undefined }> = [];
const isolatedElements = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();
let originalBodyOverflow: string | undefined;

function updateModalIsolation() {
  for (const [element, state] of isolatedElements) {
    element.inert = state.inert;
    if (state.ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", state.ariaHidden);
  }
  isolatedElements.clear();
  const portal = modalStack[modalStack.length - 1]?.portal();
  if (!portal) return;
  const allowed = portal.closest("body > *");
  for (const child of document.body.children) {
    if (!(child instanceof HTMLElement) || child === allowed) continue;
    isolatedElements.set(child, {
      inert: child.inert,
      ariaHidden: child.getAttribute("aria-hidden"),
    });
    child.inert = true;
    child.setAttribute("aria-hidden", "true");
  }
}

function addModal(portal: () => HTMLElement | undefined) {
  const entry = { portal };
  if (modalStack.length === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  modalStack.push(entry);
  updateModalIsolation();
  return () => {
    const index = modalStack.indexOf(entry);
    if (index !== -1) modalStack.splice(index, 1);
    updateModalIsolation();
    if (modalStack.length === 0) {
      document.body.style.overflow = originalBodyOverflow ?? "";
      originalBodyOverflow = undefined;
    }
  };
}

function animationTime(animation: Animation) {
  const timing = animation.effect?.getComputedTiming();
  return typeof timing?.endTime === "number" ? timing.endTime : 0;
}

/**
 * Classifies a change as one that should not be animated. Keyboard-activated presses report a
 * click with `detail === 0`, and dismissals have no motion to follow.
 */
function resolveInstantType(
  nextOpen: boolean,
  reason: PopoverRootChangeEventReason,
  event: Event,
): PopoverInstantType {
  if (reason === "trigger-press" && event instanceof MouseEvent && event.detail === 0) {
    return "click";
  }
  if (!nextOpen && (reason === "escape-key" || reason === "none")) {
    return "dismiss";
  }
  if (reason === "focus-out") {
    return "focus";
  }
  return undefined;
}

export function PopoverRoot<Payload = unknown>(props: PopoverRootProps<Payload>) {
  const parentContext = usePopoverRootContext(true);
  const rootId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const popupId = `rigid-popover-${rootId}`;
  const initialOpen = untrack(() => props.open ?? props.defaultOpen ?? false);
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(
    untrack(() => props.defaultOpen ?? false),
  );
  const [internalTriggerId, setInternalTriggerId] = createSignal<string | null>(
    untrack(() => props.defaultTriggerId ?? null),
  );
  const [mounted, setMounted] = createSignal(initialOpen);
  const [transitionStatus, setTransitionStatus] = createSignal<PopoverTransitionStatus>(
    initialOpen ? "starting" : undefined,
  );
  const [openReason, setOpenReason] = createSignal<PopoverRootChangeEventReason>("none");
  const [instantType, setInstantType] = createSignal<PopoverInstantType>(undefined);
  const [openMethod, setOpenMethod] = createSignal<PopoverInteractionType>("keyboard");
  const [titleId, setTitleId] = createSignal<string>();
  const [descriptionId, setDescriptionId] = createSignal<string>();
  const [popupElement, setPopupElement] = createSignal<HTMLDivElement>();
  const [portalElement, setPortalElement] = createSignal<HTMLDivElement>();
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement>();
  const [closePartCount, setClosePartCount] = createSignal(0);
  const [side, setSide] = createSignal<PopoverSide>("bottom");
  const [align, setAlign] = createSignal<PopoverAlign>("center");

  const descendantPortals = new Set<{ element: HTMLElement; open: () => boolean }>();
  const triggers = new Map<string, RegisteredPopoverTrigger<Payload>>();
  const [triggerRevision, setTriggerRevision] = createSignal(0);
  const open = () => (props.open === undefined ? uncontrolledOpen() : props.open);
  const activeTriggerId = () =>
    props.triggerId === undefined ? internalTriggerId() : props.triggerId;
  const activeTrigger = createMemo(() => {
    triggerRevision();
    const id = activeTriggerId();
    return id == null ? undefined : triggers.get(id);
  });
  const payload = () => activeTrigger()?.payload();
  const modal = () => props.modal ?? false;

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

  function createEventDetails(
    reason: PopoverRootChangeEventReason,
    event: Event,
    trigger: Element | undefined,
  ): PopoverRootChangeEventDetails {
    let canceled = false;
    let propagationAllowed = false;
    return {
      reason,
      event,
      trigger,
      get isCanceled() {
        return canceled;
      },
      get isPropagationAllowed() {
        return propagationAllowed;
      },
      cancel() {
        canceled = true;
      },
      allowPropagation() {
        propagationAllowed = true;
      },
      preventUnmountOnClose() {
        preventCurrentUnmount = true;
      },
    };
  }

  function requestOpen(
    nextOpen: boolean,
    reason: PopoverRootChangeEventReason,
    event = new Event("base-ui"),
    triggerId?: string,
  ) {
    const proposedTrigger = triggerId === undefined ? activeTrigger() : triggers.get(triggerId);
    const details = createEventDetails(reason, event, proposedTrigger?.element());
    preventCurrentUnmount = false;
    props.onOpenChange?.(nextOpen, details);
    if (details.isCanceled) return false;

    if (triggerId !== undefined && props.triggerId === undefined) setInternalTriggerId(triggerId);
    if (event instanceof PointerEvent) setOpenMethod(event.pointerType as PopoverInteractionType);
    else if (reason === "trigger-hover") setOpenMethod("mouse");
    else if (event instanceof KeyboardEvent) setOpenMethod("keyboard");
    setOpenReason(reason);
    setInstantType(resolveInstantType(nextOpen, reason, event));
    if (props.open === undefined) setUncontrolledOpen(nextOpen);
    return true;
  }

  function openByTrigger(triggerId: string, reason: PopoverRootChangeEventReason, event?: Event) {
    if (!triggers.has(triggerId)) {
      throw new Error(`Rigid UI: Popover trigger with id "${triggerId}" is not registered.`);
    }
    return requestOpen(true, reason, event, triggerId);
  }

  function registerTrigger(trigger: RegisteredPopoverTrigger<Payload>) {
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

  function registerTitle(id: string) {
    setTitleId(id);
    return () => setTitleId((current) => (current === id ? undefined : current));
  }

  function registerDescription(id: string) {
    setDescriptionId(id);
    return () => setDescriptionId((current) => (current === id ? undefined : current));
  }

  function registerClose() {
    setClosePartCount((count) => count + 1);
    return () => setClosePartCount((count) => Math.max(0, count - 1));
  }

  function cancelHoverClose() {
    if (hoverCloseTimer !== undefined) clearTimeout(hoverCloseTimer);
    hoverCloseTimer = undefined;
  }

  function scheduleHoverClose(triggerId: string, event: Event, delay: number) {
    cancelHoverClose();
    if (activeTriggerId() !== triggerId || openReason() !== "trigger-hover") return;
    hoverCloseTimer = setTimeout(() => {
      if (activeTriggerId() === triggerId && openReason() === "trigger-hover") {
        requestOpen(false, "trigger-hover", event, triggerId);
      }
    }, delay);
  }

  function containsTarget(target: Node | null) {
    if (!target) return false;
    if (popupElement()?.contains(target)) return true;
    // Every registered trigger counts as inside, not just the active one. Pressing a sibling
    // trigger switches the popover to it; treating that as an outside press would close the
    // popover on pointerdown and reopen it on click, which reads as a flicker.
    for (const trigger of triggers.values()) {
      if (trigger.element()?.contains(target)) return true;
    }
    for (const overlay of descendantPortals) {
      if (overlay.element.contains(target)) return true;
    }
    return false;
  }

  function hasOpenDescendant() {
    for (const overlay of descendantPortals) {
      if (overlay.open()) return true;
    }
    return false;
  }

  function registerDescendantPortal(element: HTMLElement, descendantOpen: () => boolean) {
    const overlay = { element, open: descendantOpen };
    descendantPortals.add(overlay);
    const unregisterParent = parentContext?.registerDescendantPortal(element, descendantOpen);
    return () => {
      descendantPortals.delete(overlay);
      unregisterParent?.();
    };
  }

  function registerPortalWithAncestors(element: HTMLElement) {
    return parentContext?.registerDescendantPortal(element, open) ?? (() => {});
  }
  const context: PopoverRootContextValue<Payload> = {
    open,
    mounted,
    transitionStatus,
    popupId,
    activeTriggerId,
    activeTrigger,
    payload,
    modal,
    openReason,
    openMethod,
    setOpenMethod,
    instantType,
    setInstantType,
    titleId,
    descriptionId,
    popupElement,
    portalElement,
    positionerElement,
    closePartCount,
    containsTarget,
    registerPortalWithAncestors,
    registerDescendantPortal,
    registerTrigger,
    registerTitle,
    registerDescription,
    registerClose,
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
    side,
    align,
    setPosition(nextSide, nextAlign) {
      setSide(nextSide);
      setAlign(nextAlign);
    },
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

  createEffect(
    () => open(),
    (isOpen) => {
      if (!isOpen) return;
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node | null;
        if (hasOpenDescendant()) return;
        if (!target) return;
        if (containsTarget(target)) {
          return;
        }
        if (modal() === true) {
          event.preventDefault();
          event.stopPropagation();
        }
        requestOpen(false, "outside-press", event);
      };
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        if (hasOpenDescendant()) return;
        event.preventDefault();
        requestOpen(false, "escape-key", event);
      };
      document.addEventListener("pointerdown", handlePointerDown, true);
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("pointerdown", handlePointerDown, true);
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    },
  );

  createEffect(
    () => [open() && modal() === true, portalElement()] as const,
    ([isModal, portal]) => {
      if (!isModal || !portal) return;
      return addModal(() => portal);
    },
  );

  createEffect(
    () => props.handle,
    (handle) => handle?.attach(context),
  );
  createEffect(
    () => props.actionsRef,
    (actionsRef) => {
      const actions: PopoverRootActions = {
        unmount() {
          context.forceUnmount();
        },
        close() {
          requestOpen(false, "imperative-action");
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
  // it once with a reactive props object instead of re-running it as a computation. Reactivity
  // reaches the consumer through the `payload` getter, exactly as it would through any other
  // component's props.
  const payloadProps = {
    get payload() {
      return payload();
    },
  };
  const children = () => {
    const value = props.children;
    return typeof value === "function" ? createComponent(value, payloadProps) : value;
  };

  return <PopoverRootContext value={context}>{children()}</PopoverRootContext>;
}

export namespace PopoverRoot {
  export type State = PopoverRootState;
  export type Props<Payload = unknown> = PopoverRootProps<Payload>;
  export type Actions = PopoverRootActions;
  export type ChangeEventReason = PopoverRootChangeEventReason;
  export type ChangeEventDetails = PopoverRootChangeEventDetails;
}
