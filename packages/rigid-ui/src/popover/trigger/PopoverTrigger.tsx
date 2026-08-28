import { createEffect, createSignal, createUniqueId, onCleanup, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { PopoverHandle } from "../store/PopoverHandle";
import {
  usePopoverRootContext,
  type PopoverRootContextValue,
  type RegisteredPopoverTrigger,
} from "../root/PopoverRootContext";
import { renderPart } from "../../internals/renderPart";
import { useButton } from "../../internals/use-button/useButton";
import { REASONS } from "../../internals/reasons";
import {
  pressableTriggerOpenStateMapping,
  triggerOpenStateMapping,
} from "../../utils/popupStateMapping";
import type { PopoverInteractionType, PopoverNativeProps } from "../types";
import { OPEN_DELAY } from "../utils/constants";

export interface PopoverTriggerState {
  disabled: boolean;
  open: boolean;
}

export interface PopoverTriggerProps<Payload = unknown> extends PopoverNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  PopoverTriggerState
> {
  handle?: PopoverHandle<Payload>;
  payload?: Payload;
  openOnHover?: boolean;
  delay?: number;
  closeDelay?: number;
  /**
   * Whether the rendered element is a native `<button>`. Set to `false` when `render` replaces it
   * with something else, so button semantics are applied instead of assumed.
   * @default true
   */
  nativeButton?: boolean;
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
  const context = () => localContext ?? props.handle?.context();
  const disabled = () => props.disabled !== undefined && props.disabled !== false;
  const [element, setElement] = createSignal<HTMLButtonElement>();
  const openByThisTrigger = () => {
    const store = context();
    return store?.open() === true && store.activeTriggerId() === id();
  };
  const pressed = () => openByThisTrigger() && context()?.openReason() === REASONS.triggerPress;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: () => props.nativeButton ?? true,
  });

  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let lastPointerType: PopoverInteractionType | undefined;

  createEffect(
    () => [context(), id()] as const,
    ([store, triggerId]) => {
      if (!store) return;
      const registration: RegisteredPopoverTrigger<Payload> = {
        id: triggerId,
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

  // The user's handlers are chained ahead of these by renderPart; the internal handlers only
  // observe defaultPrevented.
  return renderPart<HTMLButtonElement, PopoverTriggerState>("button", props, {
    state: () => ({ disabled: disabled(), open: openByThisTrigger() }),
    stateAttributesMapping: {
      open(value) {
        return pressed()
          ? pressableTriggerOpenStateMapping.open(value)
          : triggerOpenStateMapping.open(value);
      },
    },
    props: {
      get id() {
        return id();
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
      onPointerDown(event: PointerEvent) {
        lastPointerType = event.pointerType as PopoverInteractionType;
      },
      onPointerEnter(event: PointerEvent) {
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
        // A touch tap leaves the pointer parked wherever the cursor happened to be, so hover
        // stays disarmed until the popover is reopened by other means. Otherwise a stray
        // hover over a sibling trigger silently swaps the content the user just tapped for.
        if (
          store.open() &&
          store.openMethod() === "touch" &&
          store.openReason() === REASONS.triggerPress
        ) {
          return;
        }
        store.cancelHoverClose();
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          const latestStore = context();
          if (!latestStore || disabled()) return;
          latestStore.openByTrigger(id(), REASONS.triggerHover, event);
        }, props.delay ?? OPEN_DELAY);
      },
      onPointerLeave(event: PointerEvent) {
        clearTimeout(hoverTimer);
        const store = context();
        if (!store || !props.openOnHover) return;
        store.scheduleHoverClose(id(), event, props.closeDelay ?? 0);
      },
      onClick(event: MouseEvent) {
        if (event.defaultPrevented || disabled()) return;
        clearTimeout(hoverTimer);
        const store = context();
        if (!store) return;

        // A click carries no pointer type, and keyboard activation reports `detail === 0`
        // with no preceding `pointerdown`. Pair the two so the popover knows a tap from a
        // keypress.
        store.setOpenMethod(event.detail === 0 ? "keyboard" : (lastPointerType ?? "mouse"));
        lastPointerType = undefined;

        const wasHoverOpened = openByThisTrigger() && store.openReason() === REASONS.triggerHover;
        if (openByThisTrigger() && !wasHoverOpened) {
          store.requestOpen(false, REASONS.triggerPress, event, id());
        } else {
          store.openByTrigger(id(), REASONS.triggerPress, event);
        }
      },
    },
    propsGetter: getButtonProps,
    ref: [buttonRef as (element: HTMLButtonElement) => void, setElement],
    exclude: ["nativeButton"],
  });
}

export namespace PopoverTrigger {
  export type State = PopoverTriggerState;
  export type Props = PopoverTriggerProps;
}
