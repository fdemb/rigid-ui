import { createEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import { useButton } from "../../internals/use-button/useButton";
import type { StateAttributesMapping } from "../../internals/getStateAttributesProps";
import { triggerOpenStateMapping } from "../../utils/collapsibleStateMapping";
import type { PopupNativeProps } from "../../utils/domProps";
import { useAccordionItemContext, type AccordionItemState } from "../item/AccordionItemContext";
import { accordionStateAttributesMapping } from "../item/stateAttributesMapping";

export interface AccordionTriggerState extends AccordionItemState {}

export interface AccordionTriggerProps extends PopupNativeProps<
  HTMLButtonElement,
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  AccordionTriggerState
> {
  /**
   * Whether the rendered element is a native `<button>`. Set to `false` when `render` replaces it
   * with something else, so button semantics are applied instead of assumed.
   * @default true
   */
  nativeButton?: boolean;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

const stateAttributesMapping = {
  ...accordionStateAttributesMapping,
  ...triggerOpenStateMapping,
} satisfies StateAttributesMapping<AccordionTriggerState>;

export function AccordionTrigger(props: AccordionTriggerProps) {
  const itemContext = useAccordionItemContext();
  const context = () => itemContext!;

  const disabled = () => (props.disabled || context().disabled()) as boolean;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: () => props.nativeButton ?? true,
  });

  createEffect(
    () => (typeof props.id === "string" ? props.id : undefined),
    (registeredId) => {
      const store = context();
      // The effect cleanup nulls the id first, so writing the registered id (or `undefined`
      // for the generated fallback) unconditionally is enough to cover add, change, and remove.
      store.setTriggerId(registeredId);
      return () => {
        store.setTriggerId((current: string | null | undefined) =>
          current === registeredId ? null : current,
        );
      };
    },
  );

  return renderPart<HTMLButtonElement, AccordionTriggerState>("button", props, {
    state: context().state,
    stateAttributesMapping,
    props: [
      {
        get id() {
          return typeof props.id === "string" ? props.id : context().defaultTriggerId;
        },
        get "aria-controls"() {
          return context().open() ? context().panelId() : undefined;
        },
        get "aria-expanded"() {
          return context().open() ? "true" : "false";
        },
        onClick(event: MouseEvent) {
          if (event.defaultPrevented || disabled()) {
            return;
          }
          context().handleTrigger(event);
        },
      },
    ],
    propsGetter: getButtonProps,
    ref: [buttonRef as (element: HTMLButtonElement) => void],
    exclude: ["nativeButton", "disabled", "id"],
  });
}

export namespace AccordionTrigger {
  export type State = AccordionTriggerState;
  export type Props = AccordionTriggerProps;
}
