import { createEffect, createSignal, createUniqueId, onCleanup, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { TooltipHandle } from "../store/TooltipHandle";
import { useTooltipProviderContext } from "../provider/TooltipProviderContext";
import {
  useTooltipRootContext,
  type RegisteredTooltipTrigger,
  type TooltipRootContextValue,
} from "../root/TooltipRootContext";
import { renderElement } from "../../internals/renderElement";
import { REASONS } from "../../internals/reasons";
import { triggerOpenStateMapping } from "../../utils/popupStateMapping";
import { OPEN_DELAY } from "../utils/constants";
import type { TooltipNativeProps } from "../types";

export interface TooltipTriggerState {
  /** Whether the tooltip is currently open and was opened by this trigger. */
  open: boolean;
}

export interface TooltipTriggerProps<Payload = unknown> extends TooltipNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> {
  handle?: TooltipHandle<Payload>;
  payload?: Payload;
  /**
   * How long to wait before opening the tooltip on hover, in milliseconds.
   * @default 600
   */
  delay?: number;
  /** Whether the tooltip closes when this trigger is clicked. @default true */
  closeOnClick?: boolean;
  /** How long to wait before closing after the pointer leaves, in milliseconds. @default 0 */
  closeDelay?: number;
  /**
   * If true, the tooltip will not open from this trigger. Does not apply the native `disabled`
   * attribute; pass it separately to disable the button itself.
   * @default false
   */
  disabled?: boolean;
}

export function TooltipTrigger<Payload = unknown>(props: TooltipTriggerProps<Payload>) {
  const localContext = useTooltipRootContext(true) as TooltipRootContextValue<Payload> | undefined;
  if (!localContext && !untrack(() => props.handle)) {
    throw new Error(
      "Rigid UI: <Tooltip.Trigger> must be used within <Tooltip.Root> or receive a handle.",
    );
  }
  const provider = useTooltipProviderContext(true);

  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (): string =>
    typeof props.id === "string" ? props.id : `rigid-tooltip-trigger-${generatedId}`;
  const context = () => localContext ?? props.handle?.context();
  // The root-level disabled flag wins over an opt-in per trigger; a trigger can only disable
  // itself, never re-enable a tooltip whose root is disabled.
  const disabled = () => (localContext?.disabled() ?? false) || props.disabled === true;
  const [element, setElement] = createSignal<HTMLButtonElement>();
  // Reactive view for rendered attributes…
  const openByThisTrigger = () => {
    const store = context();
    return store?.open() === true && store.activeTriggerId() === id();
  };
  // …and the synchronous mirror for decisions inside handlers, where signal writes from a
  // sibling handler in the same tick (focus opening before click) are not visible yet.
  const openByThisTriggerSync = () => {
    const store = context();
    if (!store) return false;
    const snapshot = store.readState();
    return snapshot.open && snapshot.activeTriggerId === id();
  };

  let openTimer: ReturnType<typeof setTimeout> | undefined;
  // Set between pointerdown and click so the focus event a press generates is not mistaken for
  // keyboard focus; only real keyboard focus should open the tooltip instantly.
  let sawPointerDown = false;

  createEffect(
    () => [context(), id()] as const,
    ([store, triggerId]) => {
      if (!store) return;
      const registration: RegisteredTooltipTrigger<Payload> = {
        id: triggerId,
        element,
        payload: () => props.payload,
        disabled,
        closeOnClick: () => props.closeOnClick ?? true,
        closeDelay: () => resolvedCloseDelay(),
      };
      return store.registerTrigger(registration);
    },
  );

  onCleanup(() => clearTimeout(openTimer));

  const resolvedCloseDelay = () => props.closeDelay ?? provider?.closeDelay ?? 0;
  const resolvedOpenDelay = (): number => {
    // Adjacent tooltips in a provider group open instantly while one is already visible.
    if (context()?.isInstantPhase()) return 0;
    return props.delay ?? provider?.delay ?? OPEN_DELAY;
  };

  function cancelPendingOpen() {
    clearTimeout(openTimer);
    openTimer = undefined;
  }

  // The user's handlers are chained ahead of these by renderElement; the internal handlers only
  // observe defaultPrevented.
  const internalProps = {
    get id() {
      return id();
    },
    get type() {
      return props.type ?? "button";
    },
    get disabled() {
      return props.disabled !== undefined && props.disabled !== false;
    },
    get "data-popup-open"() {
      return openByThisTrigger() ? "" : undefined;
    },
    get "data-closed"() {
      return !openByThisTrigger() ? "" : undefined;
    },
    get "data-trigger-disabled"() {
      return disabled() ? "" : undefined;
    },
    onPointerEnter(event: PointerEvent) {
      if (event.defaultPrevented || disabled() || event.pointerType === "touch") return;
      const store = context();
      if (!store || store.readState().open) return;
      cancelPendingOpen();
      openTimer = setTimeout(() => {
        const latestStore = context();
        if (!latestStore || disabled()) return;
        latestStore.openByTrigger(id(), REASONS.triggerHover, event);
      }, resolvedOpenDelay());
    },
    onPointerLeave(event: PointerEvent) {
      cancelPendingOpen();
      const store = context();
      if (!store || !openByThisTriggerSync()) return;
      store.scheduleHoverClose(id(), event, resolvedCloseDelay());
    },
    onFocus(event: FocusEvent) {
      if (event.defaultPrevented || disabled() || sawPointerDown) return;
      const store = context();
      if (!store || store.readState().open) return;
      cancelPendingOpen();
      // Focus opens skip the rest delay: keyboard users should not wait out a hover timer that
      // was tuned for pointers.
      store.openByTrigger(id(), REASONS.triggerFocus, event);
    },
    onBlur(event: FocusEvent) {
      if (event.defaultPrevented) return;
      cancelPendingOpen();
      const store = context();
      if (!store || !openByThisTriggerSync()) return;
      if (store.openReason() === REASONS.triggerHover) return;
      store.requestOpen(false, REASONS.triggerFocus, event, id());
    },
    onPointerDown() {
      sawPointerDown = true;
      const store = context();
      // A press means deliberate interaction; a pending hover reveal would fight it.
      if (store && !store.open()) cancelPendingOpen();
    },
    onClick(event: MouseEvent) {
      sawPointerDown = false;
      if (event.defaultPrevented || disabled()) return;
      cancelPendingOpen();
      const store = context();
      if (!store) return;
      if (props.closeOnClick ?? true) {
        if (openByThisTriggerSync()) {
          store.requestOpen(false, REASONS.triggerPress, event, id());
        }
      }
    },
  };

  return (
    <button
      {...renderElement<HTMLButtonElement, { open: boolean }>(
        props as unknown as Record<string, unknown>,
        {
          props: [internalProps],
          state: () => ({ open: openByThisTrigger() }),
          stateAttributesMapping: triggerOpenStateMapping,
          ref: setElement,
          exclude: ["payload", "handle", "delay", "closeDelay", "closeOnClick", "id"],
        },
      )}
    >
      {props.children}
    </button>
  );
}

export namespace TooltipTrigger {
  export type State = TooltipTriggerState;
  export type Props<Payload = unknown> = TooltipTriggerProps<Payload>;
}
