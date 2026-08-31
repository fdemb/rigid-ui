import { createEffect, createSignal, createUniqueId, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { TooltipHandle } from "../store/TooltipHandle";
import { useTooltipProviderContext } from "../provider/TooltipProviderContext";
import {
  useTooltipRootContext,
  type RegisteredTooltipTrigger,
  type TooltipRootContextValue,
} from "../root/TooltipRootContext";
import { createTooltipTriggerInteractions } from "./createTooltipTriggerInteractions";
import { renderPart } from "../../internals/renderPart";
import { triggerOpenStateMapping } from "../../utils/popupStateMapping";
import { OPEN_DELAY } from "../utils/constants";
import type { TooltipNativeProps } from "../types";

export interface TooltipTriggerState {
  /** Whether the tooltip is currently open and was opened by this trigger. */
  open: boolean;
}

export interface TooltipTriggerProps<Payload = unknown> extends TooltipNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  TooltipTriggerState
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
   * If true, the tooltip will not open from this trigger. This does not apply the native
   * `disabled` attribute; pass it to the element returned by `render` to disable the element.
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
  const disabled = () => props.disabled ?? context()?.disabled() ?? false;
  const closeOnClick = () => props.closeOnClick ?? true;
  const [element, setElement] = createSignal<HTMLButtonElement>();
  const openByThisTrigger = () => {
    const store = context();
    return store?.open() === true && store.activeTriggerId() === id();
  };

  createEffect(
    () => [context(), id()] as const,
    ([store, triggerId]) => {
      if (!store) return;
      const registration: RegisteredTooltipTrigger<Payload> = {
        id: triggerId,
        element,
        payload: () => props.payload,
        disabled,
        closeOnClick,
        closeDelay: () => resolvedCloseDelay(),
      };
      return store.registerTrigger(registration);
    },
  );

  const resolvedCloseDelay = () => props.closeDelay ?? provider?.closeDelay ?? 0;
  const resolvedOpenDelay = (): number => {
    // Adjacent tooltips in a provider group open instantly while one is already visible.
    if (context()?.isInstantPhase()) return 0;
    return props.delay ?? provider?.delay ?? OPEN_DELAY;
  };

  const interactionProps = createTooltipTriggerInteractions({
    id,
    element,
    context,
    disabled,
    openDelay: resolvedOpenDelay,
    closeDelay: resolvedCloseDelay,
    closeOnClick,
  });

  const identityProps = {
    type: "button",
    get id() {
      return id();
    },
    get "data-trigger-disabled"() {
      return disabled() ? "" : undefined;
    },
  };

  return renderPart<HTMLButtonElement, TooltipTriggerState>("button", props, {
    props: [interactionProps, identityProps],
    state: () => ({ open: openByThisTrigger() }),
    stateAttributesMapping: triggerOpenStateMapping,
    ref: setElement,
    exclude: ["payload", "handle", "delay", "closeDelay", "closeOnClick", "disabled", "id"],
  });
}

export namespace TooltipTrigger {
  export type State = TooltipTriggerState;
  export type Props<Payload = unknown> = TooltipTriggerProps<Payload>;
}
