import { createSignal, onCleanup, untrack, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import {
  AccordionRootContext,
  type AccordionRootChangeEventDetails,
  type AccordionRootChangeEventReason,
  type AccordionRootContextValue,
  type AccordionRootState,
  type AccordionValue,
} from "./AccordionRootContext";

export interface AccordionRootProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  AccordionRootState
> {
  /**
   * The controlled value of the item(s) that should be expanded.
   *
   * To render an uncontrolled accordion, use the `defaultValue` prop instead.
   */
  value?: AccordionValue | undefined;
  /**
   * The uncontrolled value of the item(s) that should be initially expanded.
   *
   * To render a controlled accordion, use the `value` prop instead.
   */
  defaultValue?: AccordionValue | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Allows the browser's built-in page search to find and expand the panel contents.
   *
   * Overrides the `keepMounted` prop and uses `hidden="until-found"`
   * to hide the element without removing it from the DOM.
   * @default false
   */
  hiddenUntilFound?: boolean | undefined;
  /**
   * Whether to keep the element in the DOM while the panel is closed.
   * This prop is ignored when `hiddenUntilFound` is used.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * Whether multiple items can be open at the same time.
   * @default false
   */
  multiple?: boolean | undefined;
  /**
   * Event handler called when the value changes.
   */
  onValueChange?:
    | ((value: AccordionValue, eventDetails: AccordionRootChangeEventDetails) => void)
    | undefined;
  /**
   * The component orientation.
   *
   * Deprecated following the APG guidance update to remove roving focus.
   * This prop no longer affects keyboard focus behavior.
   * @deprecated
   * @default 'vertical'
   */
  orientation?: AccordionRootState["orientation"] | undefined;
  /**
   * Deprecated following the APG guidance update to remove roving focus.
   *
   * This prop no longer affects keyboard focus behavior.
   * @deprecated
   */
  loopFocus?: boolean | undefined;
}

const rootStateAttributesMapping = {
  value: () => null,
};

export function AccordionRoot(props: AccordionRootProps) {
  if (import.meta.env.DEV) {
    if (untrack(() => props.hiddenUntilFound && props.keepMounted === false)) {
      console.warn(
        "Base UI: The `keepMounted={false}` prop on `Accordion.Root` is ignored when `hiddenUntilFound` is enabled, since panels must remain mounted while closed.",
      );
    }
  }

  const [uncontrolledValue, setUncontrolledValue] = createSignal<AccordionValue>(
    untrack(() => props.defaultValue ?? []),
  );
  const value = (): AccordionValue => props.value ?? uncontrolledValue();

  function handleValueChange(
    newValue: unknown,
    nextOpen: boolean,
    details: AccordionRootChangeEventDetails,
  ) {
    const current = value();
    const multiple = props.multiple ?? false;
    let nextValue: AccordionValue;
    if (!multiple) {
      nextValue = current[0] === newValue ? [] : [newValue];
    } else if (nextOpen) {
      nextValue = current.slice();
      nextValue.push(newValue);
    } else {
      nextValue = current.filter((v) => v !== newValue);
    }
    props.onValueChange?.(nextValue, details);
    if (details.isCanceled) {
      return;
    }
    if (props.value === undefined) {
      setUncontrolledValue(nextValue);
    }
  }

  const state: Accessor<AccordionRootState> = () => ({
    value: value(),
    disabled: props.disabled ?? false,
    orientation: props.orientation ?? "vertical",
  });

  // Item order follows component setup order, which matches DOM order for statically
  // declared items. Plain array bookkeeping on purpose: Solid 2 forbids signal writes during
  // component setup, and the index is only informational (`data-index`). Indexes compact when
  // items unmount but do not track later insertions ahead of existing items.
  const itemTokens: Array<object> = [];

  function registerItem(): Accessor<number> {
    const token: object = {};
    itemTokens.push(token);
    onCleanup(() => {
      const position = itemTokens.indexOf(token);
      if (position !== -1) {
        itemTokens.splice(position, 1);
      }
    });
    return () => itemTokens.indexOf(token);
  }

  const context: AccordionRootContextValue = {
    disabled: () => props.disabled ?? false,
    value,
    state,
    hiddenUntilFound: () => props.hiddenUntilFound ?? false,
    keepMounted: () => props.keepMounted ?? false,
    handleValueChange,
    registerItem,
  };

  return (
    <AccordionRootContext value={context}>
      {renderPart<HTMLDivElement, AccordionRootState>("div", props, {
        state,
        stateAttributesMapping: rootStateAttributesMapping,
        exclude: [
          "value",
          "defaultValue",
          "disabled",
          "hiddenUntilFound",
          "keepMounted",
          "multiple",
          "onValueChange",
          "orientation",
          "loopFocus",
        ],
      })}
    </AccordionRootContext>
  );
}

export namespace AccordionRoot {
  export type State = AccordionRootState;
  export type Props = AccordionRootProps;
  export type Value = AccordionValue;
  export type ChangeEventReason = AccordionRootChangeEventReason;
  export type ChangeEventDetails = AccordionRootChangeEventDetails;
}
