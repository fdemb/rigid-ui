import { createEffect, createSignal, createUniqueId, omit, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { DialogHandle } from "../store/DialogHandle";
import {
  useDialogRootContext,
  type DialogRootContextValue,
  type RegisteredDialogTrigger,
} from "../root/DialogRootContext";
import { type DialogInteractionType } from "../types";
import { assignRef, callEventHandler, type PopupNativeProps } from "../../utils/domProps";

export interface DialogTriggerState {
  disabled: boolean;
  open: boolean;
}

export interface DialogTriggerProps<Payload = unknown> extends PopupNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> {
  handle?: DialogHandle<Payload>;
  payload?: Payload;
}

export function DialogTrigger<Payload = unknown>(props: DialogTriggerProps<Payload>) {
  const localContext = useDialogRootContext(true) as DialogRootContextValue<Payload> | undefined;
  if (!localContext && !untrack(() => props.handle)) {
    throw new Error(
      "Rigid UI: <Dialog.Trigger> must be used within <Dialog.Root> or receive a handle.",
    );
  }

  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-dialog-trigger-${generatedId}`;
  const context = () => localContext ?? props.handle?.context();
  const disabled = () => props.disabled !== undefined && props.disabled !== false;
  const [element, setElement] = createSignal<HTMLButtonElement>();
  const openByThisTrigger = () => {
    const store = context();
    return store?.open() === true && store.activeTriggerId() === id();
  };
  const others = omit(props, "ref", "payload", "handle", "style", "onClick", "onPointerDown");

  let lastPointerType: DialogInteractionType | undefined;

  createEffect(
    () => [context(), id()] as const,
    ([store, triggerId]) => {
      if (!store) return;
      const registration: RegisteredDialogTrigger<Payload> = {
        id: triggerId,
        element,
        payload: () => props.payload,
        disabled,
      };
      return store.registerTrigger(registration);
    },
  );

  function handlePointerDown(event: PointerEvent) {
    callEventHandler(props.onPointerDown, event);
    lastPointerType = event.pointerType as DialogInteractionType;
  }

  function handleClick(event: MouseEvent) {
    callEventHandler(props.onClick, event);
    if (event.defaultPrevented || disabled()) return;
    const store = context();
    if (!store) return;

    // A click carries no pointer type, and keyboard activation reports `detail === 0` with no
    // preceding `pointerdown`. Pair the two so the dialog knows a tap from a keypress.
    store.setOpenMethod(event.detail === 0 ? "keyboard" : (lastPointerType ?? "mouse"));
    lastPointerType = undefined;

    if (openByThisTrigger()) {
      store.requestOpen(false, "trigger-press", event, id());
    } else {
      store.openByTrigger(id(), "trigger-press", event);
    }
  }

  return (
    <button
      {...others}
      ref={(node) => {
        setElement(node);
        assignRef(props.ref, node);
      }}
      id={id()}
      type={props.type ?? "button"}
      disabled={disabled()}
      aria-haspopup="dialog"
      aria-expanded={openByThisTrigger() ? "true" : "false"}
      aria-controls={openByThisTrigger() ? context()?.popupId : undefined}
      data-popup-open={openByThisTrigger() ? "" : undefined}
      style={props.style}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {props.children}
    </button>
  );
}

export namespace DialogTrigger {
  export type State = DialogTriggerState;
  export type Props<Payload = unknown> = DialogTriggerProps<Payload>;
}
