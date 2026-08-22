import { createEffect, createSignal, createUniqueId, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { DialogHandle } from "../store/DialogHandle";
import {
  useDialogRootContext,
  type DialogRootContextValue,
  type RegisteredDialogTrigger,
} from "../root/DialogRootContext";
import { type DialogInteractionType } from "../types";
import { renderElement } from "../../internals/renderElement";
import { REASONS } from "../../internals/reasons";
import { type PopupNativeProps } from "../../utils/domProps";

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

  // The user's onClick/onPointerDown are chained ahead of the internal handlers by renderElement;
  // the internal handlers only observe defaultPrevented and derive the interaction type.
  return (
    <button
      {...renderElement<HTMLButtonElement>(props as Record<string, unknown>, {
        props: [
          {
            get id() {
              return id();
            },
            get type() {
              return props.type ?? "button";
            },
            get disabled() {
              return disabled();
            },
            "aria-haspopup": "dialog",
            get "aria-expanded"() {
              return openByThisTrigger() ? "true" : "false";
            },
            get "aria-controls"() {
              return openByThisTrigger() ? context()?.popupId : undefined;
            },
            get "data-popup-open"() {
              return openByThisTrigger() ? "" : undefined;
            },
            onPointerDown(event: PointerEvent) {
              lastPointerType = event.pointerType as DialogInteractionType;
            },
            onClick(event: MouseEvent) {
              if (event.defaultPrevented || disabled()) return;
              const store = context();
              if (!store) return;

              // A click carries no pointer type, and keyboard activation reports `detail === 0`
              // with no preceding `pointerdown`. Pair the two so the dialog knows a tap from a
              // keypress.
              store.setOpenMethod(event.detail === 0 ? "keyboard" : (lastPointerType ?? "mouse"));
              lastPointerType = undefined;

              if (openByThisTrigger()) {
                store.requestOpen(false, REASONS.triggerPress, event, id());
              } else {
                store.openByTrigger(id(), REASONS.triggerPress, event);
              }
            },
          },
        ],
        ref: setElement,
        exclude: ["payload", "handle", "id"],
      })}
    >
      {props.children}
    </button>
  );
}

export namespace DialogTrigger {
  export type State = DialogTriggerState;
  export type Props<Payload = unknown> = DialogTriggerProps<Payload>;
}
