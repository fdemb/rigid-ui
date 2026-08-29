import { createEffect, createMemo, createSignal, untrack, type Accessor } from "solid-js";
import type { VirtualAnchorElement } from "../../utils/createAnchorPositioning";
import type { TooltipTrackCursorAxis } from "../types";
import type { TooltipSyncState } from "./TooltipRootContext";

type TrackedAxis = Exclude<TooltipTrackCursorAxis, "none">;

interface CursorPoint {
  clientX: number;
  clientY: number;
}

type CursorSession =
  | { kind: "idle" }
  | { kind: "armed"; triggerId: string; point: CursorPoint }
  | {
      kind: "tracking";
      triggerId: string;
      point: CursorPoint;
      anchor: VirtualAnchorElement;
    };

export interface CursorTrigger {
  id: string;
  element: Accessor<HTMLButtonElement | undefined>;
}

export type TooltipCursorTrackingView =
  | { kind: "inactive" }
  | { kind: "active"; anchor: VirtualAnchorElement };

export interface TooltipCursorTrackingContext {
  observeCursor(triggerId: string, event: MouseEvent): void;
  view: Accessor<TooltipCursorTrackingView>;
}

export interface TooltipCursorTracking extends TooltipCursorTrackingContext {
  activate(trigger: CursorTrigger): void;
  clear(): void;
}

interface CreateTooltipCursorTrackingParams {
  axis: Accessor<TooltipTrackCursorAxis>;
  activeTrigger: Accessor<CursorTrigger | undefined>;
  mounted: Accessor<boolean>;
  positionerElement: Accessor<HTMLElement | undefined>;
  disableHoverablePopup: Accessor<boolean>;
  readState(): TooltipSyncState;
}

const INACTIVE_TRACKING: TooltipCursorTrackingView = { kind: "inactive" };

function cursorRect(axis: TrackedAxis, point: CursorPoint, triggerRect: DOMRect) {
  const tracksX = axis === "x" || axis === "both";
  const tracksY = axis === "y" || axis === "both";
  const x = tracksX ? point.clientX : triggerRect.x;
  const y = tracksY ? point.clientY : triggerRect.y;
  const width = tracksX ? 0 : triggerRect.width;
  const height = tracksY ? 0 : triggerRect.height;
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
  };
}

function isMouseLikePointerType(pointerType: string | undefined) {
  return (
    pointerType === undefined ||
    pointerType === "" ||
    pointerType === "mouse" ||
    pointerType === "pen"
  );
}

export function createTooltipCursorTracking(
  params: CreateTooltipCursorTrackingParams,
): TooltipCursorTracking {
  let session: CursorSession = { kind: "idle" };
  let pointerType: string | undefined;
  const [revision, setRevision] = createSignal(0);
  const [phaseRevision, setPhaseRevision] = createSignal(0);
  let wasMounted = untrack(params.mounted);

  function replaceSession(next: CursorSession) {
    session = next;
    setPhaseRevision((value) => value + 1);
    setRevision((value) => value + 1);
  }

  function updatePoint(point: CursorPoint) {
    if (session.kind !== "tracking") return;
    session.point = point;
    setRevision((value) => value + 1);
  }

  function clear() {
    if (session.kind === "idle") return;
    replaceSession({ kind: "idle" });
  }

  function observeCursor(triggerId: string, event: MouseEvent) {
    if ("pointerType" in event && typeof event.pointerType === "string") {
      pointerType = event.pointerType;
    }
    if (untrack(params.axis) === "none" || !isMouseLikePointerType(pointerType)) return;

    const point = { clientX: event.clientX, clientY: event.clientY };
    const state = params.readState();
    if (
      session.kind === "tracking" &&
      state.open &&
      state.reason === "trigger-hover" &&
      state.activeTriggerId === triggerId &&
      session.triggerId === triggerId
    ) {
      updatePoint(point);
      return;
    }

    if (!state.open) {
      replaceSession({ kind: "armed", triggerId, point });
    }
  }

  function activate(trigger: CursorTrigger) {
    const axis = untrack(params.axis);
    if (
      axis === "none" ||
      session.kind !== "armed" ||
      session.triggerId !== trigger.id ||
      !untrack(trigger.element)
    ) {
      return;
    }

    const triggerId = trigger.id;

    const anchor: VirtualAnchorElement = {
      get contextElement() {
        const current = untrack(params.activeTrigger);
        return current?.id === triggerId ? untrack(current.element) : undefined;
      },
      getBoundingClientRect() {
        const current = session;
        const active = untrack(params.activeTrigger);
        const element = active?.id === triggerId ? untrack(active.element) : undefined;
        if (current.kind !== "tracking" || current.triggerId !== triggerId || !element) {
          return cursorRect(axis, { clientX: 0, clientY: 0 }, new DOMRect());
        }
        const currentAxis = untrack(params.axis);
        if (currentAxis === "none") {
          return element.getBoundingClientRect();
        }
        return cursorRect(currentAxis, current.point, element.getBoundingClientRect());
      },
    };

    replaceSession({ kind: "tracking", triggerId, point: session.point, anchor });
  }

  const view = createMemo<TooltipCursorTrackingView>(() => {
    revision();
    if (params.axis() === "none" || session.kind !== "tracking") return INACTIVE_TRACKING;
    const trigger = params.activeTrigger();
    if (trigger?.id !== session.triggerId || !trigger.element()) return INACTIVE_TRACKING;
    return { kind: "active", anchor: session.anchor };
  });

  createEffect(
    () => [params.axis(), params.activeTrigger()?.id, params.mounted()] as const,
    ([axis, activeTriggerId, mounted]) => {
      const didUnmount = wasMounted && !mounted;
      wasMounted = mounted;
      if (
        axis === "none" ||
        (didUnmount && session.kind === "tracking") ||
        (session.kind !== "idle" && activeTriggerId !== session.triggerId)
      ) {
        clear();
      }
    },
  );

  createEffect(
    () => [phaseRevision(), params.mounted(), params.positionerElement()] as const,
    ([, mounted, positioner]) => {
      if (!mounted || session.kind !== "tracking") return;
      const triggerElement = untrack(() => params.activeTrigger()?.element());
      const win =
        triggerElement?.ownerDocument.defaultView ?? positioner?.ownerDocument.defaultView;
      if (!win) return;

      const handleMouseMove = (event: MouseEvent) => {
        if (session.kind !== "tracking" || !isMouseLikePointerType(pointerType)) return;
        const axis = untrack(params.axis);
        if (
          axis !== "both" &&
          !untrack(params.disableHoverablePopup) &&
          positioner &&
          event.composedPath().includes(positioner)
        ) {
          return;
        }
        updatePoint({ clientX: event.clientX, clientY: event.clientY });
      };

      win.addEventListener("mousemove", handleMouseMove);
      return () => win.removeEventListener("mousemove", handleMouseMove);
    },
  );

  return { observeCursor, activate, clear, view };
}
