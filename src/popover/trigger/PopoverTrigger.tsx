import { createEffect, createSignal, createUniqueId, omit, onCleanup, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { PopoverHandle } from "../store/PopoverHandle";
import {
  usePopoverRootContext,
  type PopoverRootContextValue,
  type RegisteredPopoverTrigger,
} from "../root/PopoverRootContext";
import { assignRef, callEventHandler, mergeStyles, type PopoverNativeProps } from "../types";
import { OPEN_DELAY } from "../utils/constants";

export interface PopoverTriggerState {
  disabled: boolean;
  open: boolean;
}

export interface PopoverTriggerProps<Payload = unknown> extends PopoverNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> {
  handle?: PopoverHandle<Payload>;
  payload?: Payload;
  openOnHover?: boolean;
  delay?: number;
  closeDelay?: number;
}

export function PopoverTrigger<Payload = unknown>(props: PopoverTriggerProps<Payload>) {
  const localContext = usePopoverRootContext(true) as PopoverRootContextValue<Payload> | undefined;
  if (!localContext && !untrack(() => props.handle)) {
    throw new Error(
      "Rigid UI: <Popover.Trigger> must be used within <Popover.Root> or receive a handle.",
    );
  }

  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-popover-trigger-${generatedId}`;
  const anchorName = () => `--rigid-popover-anchor-${id().replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const context = () => localContext ?? props.handle?.context();
  const disabled = () => props.disabled !== undefined && props.disabled !== false;
  const [element, setElement] = createSignal<HTMLButtonElement>();
  const openByThisTrigger = () => {
    const store = context();
    return store?.open() === true && store.activeTriggerId() === id();
  };
  const pressed = () => openByThisTrigger() && context()?.openReason() === "trigger-press";
  const others = omit(
    props,
    "ref",
    "payload",
    "handle",
    "openOnHover",
    "delay",
    "closeDelay",
    "style",
    "onClick",
    "onPointerEnter",
    "onPointerLeave",
    "onPointerDown",
  );

  let hoverTimer: ReturnType<typeof setTimeout> | undefined;

  createEffect(
    () => [context(), id(), anchorName()] as const,
    ([store, triggerId, triggerAnchorName]) => {
      if (!store) return;
      const registration: RegisteredPopoverTrigger<Payload> = {
        id: triggerId,
        anchorName: triggerAnchorName,
        element,
        payload: () => props.payload,
        disabled,
        openOnHover: () => props.openOnHover ?? false,
        closeDelay: () => props.closeDelay ?? 0,
      };
      return store.registerTrigger(registration);
    },
  );

  onCleanup(() => clearTimeout(hoverTimer));

  function handlePointerEnter(event: PointerEvent) {
    callEventHandler(props.onPointerEnter, event);
    if (
      event.defaultPrevented ||
      disabled() ||
      !props.openOnHover ||
      event.pointerType === "touch"
    ) {
      return;
    }
    const store = context();
    if (!store) return;
    store.cancelHoverClose();
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      const latestStore = context();
      if (!latestStore || disabled()) return;
      latestStore.openByTrigger(id(), "trigger-hover", event);
    }, props.delay ?? OPEN_DELAY);
  }

  function handlePointerLeave(event: PointerEvent) {
    callEventHandler(props.onPointerLeave, event);
    clearTimeout(hoverTimer);
    const store = context();
    if (!store || !props.openOnHover) return;
    store.scheduleHoverClose(id(), event, props.closeDelay ?? 0);
  }

  function handlePointerDown(event: PointerEvent) {
    callEventHandler(props.onPointerDown, event);
  }

  function handleClick(event: MouseEvent) {
    callEventHandler(props.onClick, event);
    if (event.defaultPrevented || disabled()) return;
    clearTimeout(hoverTimer);
    const store = context();
    if (!store) return;

    const wasHoverOpened = openByThisTrigger() && store.openReason() === "trigger-hover";
    if (openByThisTrigger() && !wasHoverOpened) {
      store.requestOpen(false, "trigger-press", event, id());
    } else {
      store.openByTrigger(id(), "trigger-press", event);
    }
  }

  const style = (): JSX.CSSProperties | string =>
    mergeStyles({ "anchor-name": anchorName() }, props.style);

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
      data-pressed={pressed() ? "" : undefined}
      style={style()}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {props.children}
    </button>
  );
}

export namespace PopoverTrigger {
  export type State = PopoverTriggerState;
  export type Props<Payload = unknown> = PopoverTriggerProps<Payload>;
}
