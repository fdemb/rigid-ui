import type { InteractionType, PopupFocusTarget } from "../utils/createPopupFocusManager";

export type DialogInteractionType = InteractionType;
export type DialogFocusTarget = PopupFocusTarget;
export type DialogTransitionStatus = "starting" | "ending" | undefined;
export type DialogModal = boolean | "trap-focus";

export type DialogRootChangeEventReason =
  | "trigger-press"
  | "outside-press"
  | "escape-key"
  | "close-press"
  | "focus-out"
  | "imperative-action"
  | "none";

export interface DialogRootChangeEventDetails {
  readonly reason: DialogRootChangeEventReason;
  readonly event: Event;
  readonly trigger: Element | undefined;
  readonly isCanceled: boolean;
  cancel(): void;
  preventUnmountOnClose(): void;
}

export interface DialogRootActions {
  unmount(): void;
  close(): void;
}
