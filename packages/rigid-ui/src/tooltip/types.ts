import type { JSX } from "@solidjs/web";
import type {
  Align,
  Anchor,
  Boundary,
  CollisionAvoidance,
  CollisionPadding,
  Offset,
} from "../utils/createAnchorPositioning";
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails";
import { REASONS } from "../internals/reasons";
import type { PopupNativeProps } from "../utils/domProps";

export type TooltipSide = import("../utils/createAnchorPositioning").Side;
export type TooltipAlign = Align;
export type TooltipTransitionStatus = "starting" | "ending" | undefined;

/**
 * Why transitions should be skipped for the current change, surfaced as `data-instant`.
 * `"delay"` covers the provider instant phase: adjacent tooltips switch without animation.
 */
export type TooltipInstantType = "dismiss" | "focus" | "delay" | undefined;

export type TooltipTrackCursorAxis = "none" | "x" | "y" | "both";

export type TooltipRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.escapeKey
  | typeof REASONS.disabled
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export interface TooltipPreventUnmountOnClose {
  preventUnmountOnClose(): void;
}

export type TooltipRootChangeEventDetails = BaseUIChangeEventDetails<
  TooltipRootChangeEventReason,
  TooltipPreventUnmountOnClose
>;

export interface TooltipRootActions {
  unmount(): void;
  close(): void;
}

export type TooltipNativeProps<
  T extends HTMLElement,
  Attributes extends JSX.HTMLAttributes<T> = JSX.HTMLAttributes<T>,
  State = Record<string, unknown>,
> = PopupNativeProps<T, Attributes, State>;

export type TooltipOffset = Offset;
export type TooltipCollisionAvoidance = CollisionAvoidance;
export type TooltipCollisionPadding = CollisionPadding;
export type TooltipBoundary = Boundary;
export type TooltipAnchor = Anchor;
