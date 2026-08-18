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
  | "trigger-hover"
  | "trigger-focus"
  | "trigger-press"
  | "outside-press"
  | "escape-key"
  | "close-press"
  | "focus-out"
  | "imperative-action"
  | "none";

export interface PopoverRootChangeEventDetails {
  readonly reason: PopoverRootChangeEventReason;
  readonly event: Event;
  readonly trigger: Element | undefined;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  cancel(): void;
  allowPropagation(): void;
  preventUnmountOnClose(): void;
}

export interface PopoverRootActions {
  unmount(): void;
  close(): void;
}

export type PopoverElementRef<T extends HTMLElement> = T | ((element: T) => void);
export type PopoverFocusTarget =
  | boolean
  | HTMLElement
  | { readonly current: HTMLElement | null }
  | ((interactionType: PopoverInteractionType) => void | boolean | HTMLElement | null);

export type PopoverNativeProps<
  T extends HTMLElement,
  Attributes extends JSX.HTMLAttributes<T> = JSX.HTMLAttributes<T>,
> = Omit<Attributes, "ref"> & {
  ref?: PopoverElementRef<T>;
};

export type PopoverOffsetData = OffsetData;
export type PopoverOffset = Offset;
export type PopoverCollisionAvoidance = CollisionAvoidance;
export type PopoverCollisionPadding = CollisionPadding;
export type PopoverBoundary = Boundary;
export type PopoverVirtualElement = VirtualAnchorElement;
export type PopoverAnchor = Anchor;

export function assignRef<T extends HTMLElement>(
  ref: PopoverElementRef<T> | undefined,
  element: T,
) {
  if (typeof ref === "function") ref(element);
}

export function callEventHandler<E extends Event>(handler: unknown, event: E) {
  if (typeof handler === "function") {
    (handler as (event: E) => void)(event);
  } else if (Array.isArray(handler) && typeof handler[0] === "function") {
    (handler[0] as (data: unknown, event: E) => void)(handler[1], event);
  }
}

export function mergeStyles(
  base: JSX.CSSProperties & Record<string, string | number | undefined>,
  style: JSX.CSSProperties | string | false | undefined,
): JSX.CSSProperties | string {
  if (typeof style === "string") {
    const serialized = Object.entries(base)
      .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
      .map(
        ([name, value]) =>
          `${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`,
      )
      .join(";");
    return `${serialized};${style}`;
  }
  return style ? { ...base, ...style } : base;
}
