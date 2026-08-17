import type { JSX } from "@solidjs/web";

export type PopoverSide = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
export type PopoverAlign = "start" | "center" | "end";
export type PopoverInteractionType = "mouse" | "touch" | "pen" | "keyboard";
export type PopoverTransitionStatus = "starting" | "ending" | undefined;

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

export interface PopoverOffsetData {
  anchor: { width: number; height: number };
  positioner: { width: number; height: number };
  side: PopoverSide;
  align: PopoverAlign;
}

export type PopoverOffset = number | ((data: PopoverOffsetData) => number);

export interface PopoverCollisionAvoidance {
  side?: "flip" | "shift" | "none";
  align?: "flip" | "shift" | "none";
  fallbackAxisSide?: "start" | "end" | "none";
}

export type PopoverAnchor =
  | Element
  | null
  | { readonly current: Element | null }
  | (() => Element | null);

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
