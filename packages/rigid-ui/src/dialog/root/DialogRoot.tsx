import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  untrack,
  type Accessor,
} from "solid-js";
import { createComponent, type JSX } from "@solidjs/web";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails";
import {
  DialogRootContext,
  type DialogRootContextValue,
  type RegisteredDialogTrigger,
  useDialogRootContext,
} from "./DialogRootContext";
import { createScrollLock } from "../../utils/createScrollLock";
import type { DialogHandle } from "../store/DialogHandle";
import type {
  DialogInteractionType,
  DialogModal,
  DialogRootActions,
  DialogRootChangeEventDetails,
  DialogRootChangeEventReason,
  DialogTransitionStatus,
} from "../types";

export interface DialogRootProps<Payload = unknown> {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean, eventDetails: DialogRootChangeEventDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  actionsRef?: { current: DialogRootActions | null } | ((actions: DialogRootActions) => void);
  modal?: DialogModal;
  disablePointerDismissal?: boolean;
  triggerId?: string | null;
  defaultTriggerId?: string | null;
  handle?: DialogHandle<Payload>;
  children?: JSX.Element | ((state: { payload: Payload | undefined }) => JSX.Element);
}

export type DialogRootState = Record<never, never>;

function animationTime(animation: Animation) {
  const timing = animation.effect?.getComputedTiming();
  return typeof timing?.endTime === "number" ? timing.endTime : 0;
}

/**
 * Shared implementation behind `Dialog.Root` and `AlertDialog.Root`. The alert-dialog mode forces
 * full modality, disables pointer dismissal (an alert dialog never closes on an outside press),
 * and renders the popup with the `alertdialog` role.
 */
export function createDialogRoot<Payload = unknown>(
  mode: "dialog" | "alert-dialog",
  props: DialogRootProps<Payload>,
) {
  const parentContext = useDialogRootContext(true);
  const rootId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const popupId = `rigid-dialog-${rootId}`;
  const initialOpen = untrack(() => props.open ?? props.defaultOpen ?? false);
  const [uncontrolledOpen, setUncontrolledOpen] = createSignal(
    untrack(() => props.defaultOpen ?? false),
  );
  const [internalTriggerId, setInternalTriggerId] = createSignal<string | null>(
    untrack(() => props.defaultTriggerId ?? null),
  );
  const [mounted, setMounted] = createSignal(initialOpen);
  const [transitionStatus, setTransitionStatus] = createSignal<DialogTransitionStatus>(
    initialOpen ? "starting" : undefined,
  );
  const [openReason, setOpenReason] = createSignal<DialogRootChangeEventReason>("none");
  const [openMethod, setOpenMethod] = createSignal<DialogInteractionType>("keyboard");
  const [titleId, setTitleId] = createSignal<string>();
  const [descriptionId, setDescriptionId] = createSignal<string>();
  const [popupElement, setPopupElement] = createSignal<HTMLDivElement>();
  const [portalElement, setPortalElement] = createSignal<HTMLDivElement>();
  const [closePartCount, setClosePartCount] = createSignal(0);
  const [explicitPayload, setExplicitPayload] = createSignal<Payload | undefined>(undefined);
  const [internalBackdropElement, setInternalBackdropElement] = createSignal<HTMLDivElement>();
  const [backdropElement, setBackdropElement] = createSignal<HTMLDivElement>();

  const nestedDialogs = new Set<{ open: Accessor<boolean> }>();
  const [nestedRevision, setNestedRevision] = createSignal(0);
  const nestedOpenDialogCount = createMemo(() => {
    nestedRevision();
    let count = 0;
    for (const dialog of nestedDialogs) {
      if (dialog.open()) count += 1;
    }
    return count;
  });

  const triggers = new Map<string, RegisteredDialogTrigger<Payload>>();
  const descendantPortals = new Set<{ element: HTMLElement; open: () => boolean }>();
  const [triggerRevision, setTriggerRevision] = createSignal(0);

  const open = () => (props.open === undefined ? uncontrolledOpen() : props.open);
  const activeTriggerId = () =>
    props.triggerId === undefined ? internalTriggerId() : props.triggerId;
  const activeTrigger = createMemo(() => {
    triggerRevision();
    const id = activeTriggerId();
    return id == null ? undefined : triggers.get(id);
  });
  const payload = () => activeTrigger()?.payload() ?? explicitPayload();
  const modal = (): DialogModal => (mode === "alert-dialog" ? true : (props.modal ?? true));
  const role = () => (mode === "alert-dialog" ? "alertdialog" : "dialog");
  const isTopmost = () => nestedOpenDialogCount() === 0;

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
    if (!isOpen) setExplicitPayload(undefined);
    props.onOpenChangeComplete?.(isOpen);
  }

  function waitForAnimations(generation: number) {
    const animations = popupElement()?.getAnimations?.() ?? [];
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
    reason: DialogRootChangeEventReason,
    event: Event,
    trigger: Element | undefined,
  ): DialogRootChangeEventDetails {
    return createChangeEventDetails(reason, event, trigger, {
      preventUnmountOnClose() {
        preventCurrentUnmount = true;
      },
    });
  }

  function requestOpen(
    nextOpen: boolean,
    reason: DialogRootChangeEventReason,
    event: Event = new Event("rigid-ui"),
    triggerId?: string,
  ) {
    const proposedTrigger = triggerId === undefined ? activeTrigger() : triggers.get(triggerId);
    const details = createEventDetails(reason, event, proposedTrigger?.element());
    preventCurrentUnmount = false;
    props.onOpenChange?.(nextOpen, details);
    if (details.isCanceled) return false;

    if (triggerId !== undefined && props.triggerId === undefined) setInternalTriggerId(triggerId);
    // A click carries no pointer type; triggers pair their preceding `pointerdown` with the
    // click and report the interaction type themselves, so only infer from real pointer or
    // keyboard events here.
    if (event instanceof PointerEvent) setOpenMethod(event.pointerType as DialogInteractionType);
    else if (event instanceof KeyboardEvent) setOpenMethod("keyboard");
    setOpenReason(reason);
    if (nextOpen && triggerId !== undefined) setExplicitPayload(undefined);
    if (props.open === undefined) setUncontrolledOpen(nextOpen);
    return true;
  }

  function openByTrigger(triggerId: string, reason: DialogRootChangeEventReason, event?: Event) {
    if (!triggers.has(triggerId)) {
      throw new Error(`Rigid UI: Dialog trigger with id "${triggerId}" is not registered.`);
    }
    return requestOpen(true, reason, event, triggerId);
  }

  function registerTrigger(trigger: RegisteredDialogTrigger<Payload>) {
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

  function registerNestedDialog(dialogOpen: Accessor<boolean>) {
    const entry = { open: dialogOpen };
    nestedDialogs.add(entry);
    setNestedRevision((revision) => revision + 1);
    return () => {
      nestedDialogs.delete(entry);
      setNestedRevision((revision) => revision + 1);
    };
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

  function containsTarget(target: Node | null) {
    if (!target) return false;
    if (popupElement()?.contains(target)) return true;
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

  const context: DialogRootContextValue<Payload> = {
    open,
    mounted,
    transitionStatus,
    popupId,
    activeTriggerId,
    activeTrigger,
    payload,
    modal,
    role,
    nested: parentContext != null,
    openReason,
    openMethod,
    setOpenMethod,
    titleId,
    descriptionId,
    popupElement,
    portalElement,
    closePartCount,
    disablePointerDismissal: () =>
      mode === "alert-dialog" || (props.disablePointerDismissal ?? false),
    nestedOpenDialogCount,
    internalBackdropElement,
    setInternalBackdropElement,
    backdropElement,
    setBackdropElement,
    explicitPayload,
    setExplicitPayload,
    containsTarget,
    registerPortalWithAncestors,
    registerDescendantPortal,
    registerTrigger,
    registerTitle,
    registerDescription,
    registerClose,
    registerNestedDialog,
    setPopupElement,
    setPortalElement,
    requestOpen,
    openByTrigger,
    finishTransition,
    forceUnmount() {
      preventCurrentUnmount = false;
      setMounted(false);
      setTransitionStatus(undefined);
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

  // Dismissal: Escape and intentional outside press (down and up on the same target). Only the
  // topmost dialog dismisses; a modal dialog dismisses only through one of its backdrops.
  // `disablePointerDismissal` (implicit for alert dialogs) silences pointer dismissal only;
  // Escape keeps working.
  createEffect(
    () => [open(), mode === "alert-dialog" || (props.disablePointerDismissal ?? false)] as const,
    ([isOpen, noPointerDismissal]) => {
      if (!isOpen) return;

      let downTarget: EventTarget | null = null;
      let downWasOutside = false;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        if (!isTopmost() || hasOpenDescendant()) return;
        event.preventDefault();
        requestOpen(false, "escape-key", event);
      };

      const handlePointerDown = (event: PointerEvent) => {
        if (noPointerDismissal) return;
        downTarget = event.target;
        const target = event.target as Node | null;
        downWasOutside = target != null && !containsTarget(target);
        if (downWasOutside && modal() === true) {
          const internalBackdrop = internalBackdropElement();
          const userBackdrop = backdropElement();
          const allowedTarget =
            internalBackdrop === target ||
            userBackdrop === target ||
            (userBackdrop == null && internalBackdrop == null);
          if (!allowedTarget) {
            downWasOutside = false;
            return;
          }
          event.preventDefault();
          event.stopPropagation();
        }
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (noPointerDismissal) return;
        if (!isTopmost() || hasOpenDescendant()) return;
        if (!downWasOutside || event.target !== downTarget) return;
        downWasOutside = false;
        requestOpen(false, "outside-press", event);
      };

      document.addEventListener("keydown", handleKeyDown, true);
      document.addEventListener("pointerdown", handlePointerDown, true);
      document.addEventListener("pointerup", handlePointerUp, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
        document.removeEventListener("pointerdown", handlePointerDown, true);
        document.removeEventListener("pointerup", handlePointerUp, true);
      };
    },
  );

  // Scroll lock engages only for fully modal dialogs; `trap-focus` keeps the page scrollable.
  createScrollLock(
    () => open() && modal() === true,
    () => popupElement() ?? null,
  );

  createEffect(
    () => parentContext,
    (parent) => {
      if (!parent) return;
      return parent.registerNestedDialog(open);
    },
  );

  createEffect(
    () => props.handle,
    (handle) => handle?.attach(context),
  );
  createEffect(
    () => props.actionsRef,
    (actionsRef) => {
      const actions: DialogRootActions = {
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
    cancelScheduledTransition();
  });

  const payloadProps = {
    get payload() {
      return payload();
    },
  };
  const children = () => {
    const value = props.children;
    return typeof value === "function" ? createComponent(value, payloadProps) : value;
  };

  return <DialogRootContext value={context}>{children()}</DialogRootContext>;
}

export function DialogRoot<Payload = unknown>(props: DialogRootProps<Payload>) {
  return createDialogRoot("dialog", props);
}

export namespace DialogRoot {
  export type State = DialogRootState;
  export type Props<Payload = unknown> = DialogRootProps<Payload>;
  export type Actions = DialogRootActions;
  export type ChangeEventReason = DialogRootChangeEventReason;
  export type ChangeEventDetails = DialogRootChangeEventDetails;
}
