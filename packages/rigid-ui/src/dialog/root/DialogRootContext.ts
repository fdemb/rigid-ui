import { createContext, useContext, type Accessor } from "solid-js";
import type {
  DialogInteractionType,
  DialogModal,
  DialogRootChangeEventReason,
  DialogTransitionStatus,
} from "../types";

export interface RegisteredDialogTrigger<Payload = unknown> {
  id: string;
  element: Accessor<HTMLButtonElement | undefined>;
  payload: Accessor<Payload | undefined>;
  disabled: Accessor<boolean>;
}

export interface DialogRootContextValue<Payload = unknown> {
  open: Accessor<boolean>;
  mounted: Accessor<boolean>;
  transitionStatus: Accessor<DialogTransitionStatus>;
  popupId: string;
  activeTriggerId: Accessor<string | null>;
  activeTrigger: Accessor<RegisteredDialogTrigger<Payload> | undefined>;
  payload: Accessor<Payload | undefined>;
  modal: Accessor<DialogModal>;
  nested: boolean;
  openReason: Accessor<DialogRootChangeEventReason>;
  openMethod: Accessor<DialogInteractionType>;
  setOpenMethod(method: DialogInteractionType): void;
  titleId: Accessor<string | undefined>;
  descriptionId: Accessor<string | undefined>;
  popupElement: Accessor<HTMLDivElement | undefined>;
  portalElement: Accessor<HTMLDivElement | undefined>;
  closePartCount: Accessor<number>;
  disablePointerDismissal: Accessor<boolean>;
  /** Number of nested dialogs opened from within this dialog while it is open. */
  nestedOpenDialogCount: Accessor<number>;
  internalBackdropElement: Accessor<HTMLDivElement | undefined>;
  setInternalBackdropElement(element: HTMLDivElement | undefined): void;
  backdropElement: Accessor<HTMLDivElement | undefined>;
  setBackdropElement(element: HTMLDivElement | undefined): void;
  /**
   * Registers a directly nested dialog's open state so this root knows whether it is topmost.
   * Returns an unregister function.
   */
  registerNestedDialog(open: Accessor<boolean>): () => void;
  /** Payload set programmatically (e.g. `DialogHandle.openWithPayload`), used when no trigger is associated. */
  explicitPayload: Accessor<Payload | undefined>;
  setExplicitPayload(payload: Payload | undefined): void;
  containsTarget(target: Node | null): boolean;
  registerPortalWithAncestors(element: HTMLElement): () => void;
  registerDescendantPortal(element: HTMLElement, open: Accessor<boolean>): () => void;
  registerTrigger(trigger: RegisteredDialogTrigger<Payload>): () => void;
  registerTitle(id: string): () => void;
  registerDescription(id: string): () => void;
  registerClose(): () => void;
  setPopupElement(element: HTMLDivElement | undefined): void;
  setPortalElement(element: HTMLDivElement | undefined): void;
  requestOpen(
    open: boolean,
    reason: DialogRootChangeEventReason,
    event?: Event,
    triggerId?: string,
  ): boolean;
  openByTrigger(triggerId: string, reason: DialogRootChangeEventReason, event?: Event): boolean;
  finishTransition(): void;
  forceUnmount(): void;
}

export const DialogRootContext = createContext<DialogRootContextValue<unknown> | null>(null);

export function useDialogRootContext(optional = false) {
  const context = useContext(DialogRootContext);
  if (!context && !optional) {
    throw new Error("Rigid UI: Dialog parts must be used within <Dialog.Root>.");
  }
  return context ?? undefined;
}
