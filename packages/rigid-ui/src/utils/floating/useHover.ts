import { createEffect, onCleanup } from "solid-js";
import type { Accessor } from "solid-js";
import { REASONS } from "../../internals/reasons";
import { contains } from "../contains";
import { getTarget } from "../getTarget";
import { Timeout } from "../useTimeout";
import type { HandleClose, HandleCloseContext } from "./safePolygon";

export type { HandleClose, HandleCloseContext, HandleCloseOptions } from "./safePolygon";

/**
 * Solid port of Base UI's `floating-ui-react` hover interaction (`hooks/useHover.ts`). React's
 * store subscription becomes reactive accessors and the returned prop bags are spread onto the
 * reference and floating elements; because Solid attaches those handlers natively there is no
 * delegation to bypass, so the React hook's parallel native-listener path collapses into the
 * prop handlers alone.
 */

/** Matches Base UI's `Delay`: a symmetric number or per-intent values. */
export type Delay = number | Partial<{ open: number; close: number }> | undefined;

// A type alias (not an interface) so it stays assignable to `Record<string, unknown>` bags.
export type FloatingOpenChangeDetails = {
  open?: boolean | undefined;
  reason?: string | undefined;
  event?: Event | undefined;
  currentTarget?: Element | undefined;
};

export interface FloatingData {
  current: {
    openEvent: { type: string } | null;
    placement?: string | undefined;
    [key: string]: unknown;
  };
}

export interface FloatingEvents {
  on(type: string, handler: (data: unknown) => void): () => void;
  off(type: string, handler: (data: unknown) => void): void;
  emit(type: string, data: unknown): void;
}

export interface FloatingContext {
  /** Whether the floating element is currently shown. */
  open: Accessor<boolean>;
  setOpen(open: boolean, details?: FloatingOpenChangeDetails): void;
  domReferenceElement: Accessor<Element | null>;
  floatingElement: Accessor<HTMLElement | null>;
  dataRef: FloatingData;
  events: FloatingEvents;
}

export interface UseHoverProps {
  /**
   * Accepts an event handler that runs on `mousemove` to control when the floating element
   * closes once the cursor leaves the reference element. @default null
   */
  handleClose?: HandleClose | null | undefined;
  /**
   * Waits until the user's cursor is at "rest" over the reference element before changing the
   * `open` state. @default 0
   */
  restMs?: number | (() => number) | undefined;
  /**
   * Waits for the specified time when the event listener runs before changing the `open`
   * state. @default 0
   */
  delay?: Delay | (() => Delay);
  /**
   * Whether moving the cursor over the floating element will open it, without a regular hover
   * event required. @default true
   */
  move?: boolean | undefined;
}

function isMouseLikePointerType(pointerType: string | undefined) {
  return pointerType === "mouse" || pointerType === "pen" || pointerType == null;
}

function resolveValue<T>(value: T | (() => T) | undefined, pointerType?: string): T | undefined {
  if (pointerType != null && !isMouseLikePointerType(pointerType)) {
    return undefined;
  }
  if (typeof value === "function") {
    return (value as () => T)();
  }
  return value;
}

function getDelay(value: Delay | (() => Delay), prop: "open" | "close", pointerType?: string) {
  const result = resolveValue(value, pointerType);
  if (typeof result === "number") {
    return result;
  }
  return result?.[prop];
}

function getRestMs(value: number | (() => number)) {
  if (typeof value === "function") {
    return value();
  }
  return value;
}

function isClickLikeOpenEvent(openEventType: string | undefined, interactedInside: boolean) {
  return interactedInside || openEventType === "click" || openEventType === "mousedown";
}

function isHoverOpenEvent(openEventType: string | undefined) {
  return openEventType?.includes("mouse") === true && openEventType !== "mousedown";
}

interface HoverProps {
  [key: string]: unknown;
}

/**
 * Opens the floating element while hovering over the reference element, like CSS `:hover`.
 */
export function useHover(context: FloatingContext, props: UseHoverProps = {}) {
  const delay = () => resolveValue(props.delay);
  const restMs = () => getRestMs(props.restMs ?? 0);

  let pointerType: string | undefined;
  let interactedInside = false;
  let mouseMoveHandler: ((event: MouseEvent) => void) | undefined;
  let blockMouseMove = true;
  let lockedElements: Array<HTMLElement> = [];
  let restTimeoutPending = false;

  const timeout = new Timeout();
  const restTimeout = new Timeout();

  const hasHoverOpenEvent = () => isHoverOpenEvent(context.dataRef.current.openEvent?.type);

  const hasClickLikeOpenEvent = () =>
    isClickLikeOpenEvent(context.dataRef.current.openEvent?.type, interactedInside);

  function changeDetails(
    event: MouseEvent | undefined,
    currentTarget?: Element,
  ): FloatingOpenChangeDetails {
    return { reason: REASONS.triggerHover, event, currentTarget };
  }

  /** Locks the body while open when `handleClose` asks for it. Deferred one microtask so the
   * floating element's control flow has mounted; consumers observe the lock after the usual
   * microtask flush. */
  function lockPointerEvents() {
    if (!props.handleClose?.__options?.blockPointerEvents || !hasHoverOpenEvent()) {
      return;
    }

    queueMicrotask(() => {
      if (!context.open() || lockedElements.length > 0) {
        return;
      }
      const reference = context.domReferenceElement();
      const floating = context.floatingElement();
      if (reference instanceof HTMLElement && floating) {
        const body = floating.ownerDocument.body;
        body.style.pointerEvents = "none";
        reference.style.pointerEvents = "auto";
        floating.style.pointerEvents = "auto";
        lockedElements = [body, reference, floating];
      }
    });
  }

  function clearPointerEvents() {
    for (const element of lockedElements.splice(0)) {
      element.style.pointerEvents = "";
    }
  }

  // Restores the body lock on any close path, including closes not driven by this hook.
  const onOpenChangeLocal = ({ open }: { open: boolean }) => {
    if (!open) {
      timeout.clear();
      restTimeout.clear();
      blockMouseMove = true;
      restTimeoutPending = false;
      clearPointerEvents();
    }
  };

  context.events.on("openchange", onOpenChangeLocal as (data: unknown) => void);
  onCleanup(() => {
    context.events.off("openchange", onOpenChangeLocal as (data: unknown) => void);
    cleanupMouseMoveHandler();
    timeout.clear();
    restTimeout.clear();
    interactedInside = false;
    clearPointerEvents();
  });

  function cleanupMouseMoveHandler() {
    if (mouseMoveHandler) {
      document.removeEventListener("mousemove", mouseMoveHandler);
      mouseMoveHandler = undefined;
    }
  }

  function closeWithDelay(event: MouseEvent, runElseBranch = true) {
    const closeDelay = getDelay(delay(), "close", pointerType);
    if (closeDelay && !mouseMoveHandler) {
      timeout.start(closeDelay, () => context.setOpen(false, changeDetails(event)));
    } else if (runElseBranch) {
      timeout.clear();
      context.setOpen(false, changeDetails(event));
    }
  }

  function getHandleCloseHandler(event: MouseEvent, onClose: () => void) {
    const handleCloseProp = props.handleClose;
    if (!handleCloseProp) {
      return null;
    }

    const handleCloseContext: HandleCloseContext = {
      x: event.clientX,
      y: event.clientY,
      placement: context.dataRef.current.placement ?? null,
      domReferenceElement: context.domReferenceElement(),
      floatingElement: context.floatingElement(),
      onClose,
    };

    const handler = handleCloseProp(handleCloseContext);
    return typeof handler === "function" ? handler : null;
  }

  // A pending open timer must not fire once its trigger is gone.
  createEffect(
    () => context.domReferenceElement(),
    (reference, previous) => {
      if (!reference && previous) {
        timeout.clear();
        restTimeout.clear();
        restTimeoutPending = false;
        blockMouseMove = true;
      }
    },
  );

  createEffect(
    () => context.open(),
    (isOpen) => {
      if (!isOpen) {
        pointerType = undefined;
        restTimeoutPending = false;
        interactedInside = false;
        cleanupMouseMoveHandler();
        clearPointerEvents();
      }
    },
  );

  function setPointerRef(event: PointerEvent) {
    pointerType = event.pointerType ?? pointerType;

    const target = getTarget(event) as Element | null;
    const interactive =
      target?.matches("button,a,input,select,textarea,[tabindex]:not([tabindex='-1'])") ?? false;
    interactedInside = interactive;
  }

  function handleReferenceEnter(event: MouseEvent) {
    timeout.clear();
    blockMouseMove = false;

    if (restMs() > 0 && !getDelay(delay(), "open")) {
      return;
    }

    const openDelay = getDelay(delay(), "open", pointerType);
    const triggerEl = event.currentTarget as HTMLElement;

    if (openDelay) {
      timeout.start(openDelay, () => {
        if (!context.open()) {
          context.setOpen(true, changeDetails(event, triggerEl));
          lockPointerEvents();
        }
      });
    } else if (!context.open()) {
      context.setOpen(true, changeDetails(event, triggerEl));
      lockPointerEvents();
    }
  }

  function handleReferenceLeave(event: MouseEvent) {
    if (hasClickLikeOpenEvent()) {
      clearPointerEvents();
      return;
    }

    cleanupMouseMoveHandler();
    restTimeout.clear();
    restTimeoutPending = false;

    const handler = getHandleCloseHandler(event, () => {
      clearPointerEvents();
      cleanupMouseMoveHandler();
      if (!hasClickLikeOpenEvent()) {
        closeWithDelay(event, true);
      }
    });

    // The polygon bridge only applies while the cursor could be traversing the gap between the
    // elements; a leave with no `relatedTarget` inside the floating element is a full exit.
    const exitsFully =
      !event.relatedTarget ||
      !contains(context.floatingElement(), event.relatedTarget as Element | null);

    if (handler && !exitsFully) {
      // Prevent clearing a pending close when the polygon bridge takes over.
      if (!context.open()) {
        timeout.clear();
      }

      mouseMoveHandler = handler;
      document.addEventListener("mousemove", handler);

      return;
    }

    // Allow interactivity without `safePolygon` on touch devices. With a pointer, a short close
    // delay is an alternative, so it should work consistently.
    const shouldClose =
      pointerType === "touch"
        ? !contains(context.floatingElement(), event.relatedTarget as Element | null)
        : true;
    if (shouldClose) {
      closeWithDelay(event);
    }
  }

  function getReferenceProps(): HoverProps {
    return {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseEnter: handleReferenceEnter,
      onMouseLeave: handleReferenceLeave,
      onMouseMove(event: MouseEvent & { movementX?: number }) {
        const movementX = event.movementX ?? 0;
        const movementY = event.movementY ?? 0;

        // Mirrors Base UI's `{ once: true }` mousemove listener: the first movement carries
        // enter semantics so restMs engages even without a preceding mouseenter.
        if (blockMouseMove) {
          handleReferenceEnter(event);
        }

        function handleMouseMove() {
          if (!blockMouseMove && !context.open()) {
            context.setOpen(true, changeDetails(event, event.currentTarget as HTMLElement));
            lockPointerEvents();
          }
        }

        if (context.open() || restMs() === 0) {
          return;
        }

        // Ignore insignificant movements to account for tremors.
        if (restTimeoutPending && movementX ** 2 + movementY ** 2 < 2) {
          return;
        }

        restTimeout.clear();

        if (pointerType === "touch") {
          handleMouseMove();
        } else {
          restTimeoutPending = true;
          restTimeout.start(restMs(), handleMouseMove);
        }
      },
    };
  }

  function getFloatingProps(): HoverProps {
    return {
      onMouseEnter() {
        timeout.clear();
        clearPointerEvents();
      },
      onMouseLeave(event: MouseEvent) {
        if (!hasClickLikeOpenEvent()) {
          closeWithDelay(event, false);
        }
      },
    };
  }

  return { getReferenceProps, getFloatingProps };
}
