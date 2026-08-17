import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  untrack,
} from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  PopoverRootContext,
  type PopoverRootContextValue,
  type RegisteredPopoverTrigger,
} from "./PopoverRootContext";
import type { PopoverHandle } from "../store/PopoverHandle";
import type {
  PopoverAlign,
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

function parseDurationList(value: string) {
  return value.split(",").reduce((maximum, duration) => {
    const item = duration.trim();
    const milliseconds = item.endsWith("ms")
      ? Number.parseFloat(item)
      : Number.parseFloat(item) * 1000;
    return Number.isFinite(milliseconds) ? Math.max(maximum, milliseconds) : maximum;
  }, 0);
}

function getTransitionDuration(element: HTMLElement | undefined) {
  if (!element || typeof getComputedStyle === "undefined") return 0;
  const style = getComputedStyle(element);
  return Math.max(
    parseDurationList(style.transitionDuration) + parseDurationList(style.transitionDelay),
    parseDurationList(style.animationDuration) + parseDurationList(style.animationDelay),
  );
}

export function PopoverRoot<Payload = unknown>(props: PopoverRootProps<Payload>) {
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
  const [openMethod, setOpenMethod] = createSignal<PopoverInteractionType>("keyboard");
  const [titleId, setTitleId] = createSignal<string>();
  const [descriptionId, setDescriptionId] = createSignal<string>();
  const [popupElement, setPopupElement] = createSignal<HTMLDivElement>();
  const [portalElement, setPortalElement] = createSignal<HTMLDivElement>();
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement>();
  const [closePartCount, setClosePartCount] = createSignal(0);
  const [side, setSide] = createSignal<PopoverSide>("bottom");
  const [align, setAlign] = createSignal<PopoverAlign>("center");

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

  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let hoverCloseTimer: ReturnType<typeof setTimeout> | undefined;
  let transitionFrame: number | undefined;
  let preventCurrentUnmount = false;
  let lastOpen = initialOpen;

  function cancelScheduledTransition() {
    if (closeTimer !== undefined) clearTimeout(closeTimer);
    if (transitionFrame !== undefined && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(transitionFrame);
    }
    closeTimer = undefined;
    transitionFrame = undefined;
  }

  function finishTransition() {
    cancelScheduledTransition();
    const isOpen = open();
    setTransitionStatus(undefined);
    if (!isOpen && !preventCurrentUnmount) setMounted(false);
    props.onOpenChangeComplete?.(isOpen);
  }

  function scheduleTransitionCompletion() {
    cancelScheduledTransition();
    const complete = () => {
      const duration = Math.max(
        getTransitionDuration(popupElement()),
        getTransitionDuration(positionerElement()),
      );
      if (duration > 0) {
        closeTimer = setTimeout(finishTransition, duration + 50);
      } else {
        queueMicrotask(finishTransition);
      }
    };
    if (typeof requestAnimationFrame === "undefined") complete();
    else transitionFrame = requestAnimationFrame(complete);
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
    titleId,
    descriptionId,
    popupElement,
    portalElement,
    positionerElement,
    closePartCount,
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
      scheduleTransitionCompletion();
    },
  );

  createEffect(
    () => open(),
    (isOpen) => {
      if (!isOpen) return;
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node | null;
        if (!target) return;
        const trigger = activeTrigger()?.element();
        if (
          trigger?.contains(target) ||
          popupElement()?.contains(target) ||
          portalElement()?.contains(target)
        ) {
          return;
        }
        requestOpen(false, "outside-press", event);
      };
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
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
    () => open() && modal() === true,
    (lockScroll) => {
      if (!lockScroll) return;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
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
  if (initialOpen) scheduleTransitionCompletion();
  onCleanup(() => {
    cancelHoverClose();
    cancelScheduledTransition();
  });

  const children = () => {
    const value = props.children;
    return typeof value === "function" ? value({ payload: payload() }) : value;
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
