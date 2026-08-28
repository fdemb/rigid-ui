import type { JSX } from "@solidjs/web";
import type {
  Align,
  Anchor,
  Boundary,
  CollisionAvoidance,
  CollisionPadding,
  Offset,
  OffsetData,
  Side,
  VirtualAnchorElement,
} from "../utils/createAnchorPositioning";
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails";
import { REASONS } from "../internals/reasons";
import type { PopupNativeProps, PopupElementRef } from "../utils/domProps";

export type PopoverSide = Side;
export type PopoverAlign = Align;
export type PopoverInteractionType = "mouse" | "touch" | "pen" | "keyboard";
export type PopoverTransitionStatus = "starting" | "ending" | undefined;

/**
 * Why transitions should be skipped for the current change, surfaced as `data-instant`.
 * Styling hint only — suppressing the transition is the consumer's choice.
 */
export type PopoverInstantType = "dismiss" | "click" | "focus" | "trigger-change" | undefined;

export type PopoverRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export interface PopoverPreventUnmountOnClose {
  preventUnmountOnClose(): void;
}

export type PopoverRootChangeEventDetails = BaseUIChangeEventDetails<
  PopoverRootChangeEventReason,
  PopoverPreventUnmountOnClose
>;

export interface PopoverRootActions {
  unmount(): void;
  close(): void;
}

export type PopoverElementRef<T extends HTMLElement> = PopupElementRef<T>;
export type PopoverFocusTarget =
  | boolean
  | HTMLElement
  | { readonly current: HTMLElement | null }
  | ((interactionType: PopoverInteractionType) => void | boolean | HTMLElement | null);

export type PopoverNativeProps<
  T extends HTMLElement,
  Attributes extends JSX.HTMLAttributes<T> = JSX.HTMLAttributes<T>,
  State = Record<string, unknown>,
> = PopupNativeProps<T, Attributes, State>;

export type PopoverOffsetData = OffsetData;
export type PopoverOffset = Offset;
export type PopoverCollisionAvoidance = CollisionAvoidance;
export type PopoverCollisionPadding = CollisionPadding;
export type PopoverBoundary = Boundary;
export type PopoverVirtualElement = VirtualAnchorElement;
export type PopoverAnchor = Anchor;
