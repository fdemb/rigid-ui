import type { JSX } from "@solidjs/web";
import type { InteractionType, PopupFocusTarget } from "../utils/createPopupFocusManager";
import type { BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails";
import { REASONS } from "../internals/reasons";
import type { PopupNativeProps, PopupElementRef } from "../utils/domProps";

export type DialogInteractionType = InteractionType;
export type DialogFocusTarget = PopupFocusTarget;
export type DialogTransitionStatus = "starting" | "ending" | undefined;
export type DialogModal = boolean | "trap-focus";

export type DialogRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export interface DialogPreventUnmountOnClose {
  preventUnmountOnClose(): void;
}

export type DialogRootChangeEventDetails = BaseUIChangeEventDetails<
  DialogRootChangeEventReason,
  DialogPreventUnmountOnClose
>;

export interface DialogRootActions {
  unmount(): void;
  close(): void;
}

export type DialogElementRef<T extends HTMLElement> = PopupElementRef<T>;

export type DialogNativeProps<
  T extends HTMLElement,
  Attributes extends JSX.HTMLAttributes<T> = JSX.HTMLAttributes<T>,
> = PopupNativeProps<T, Attributes>;
