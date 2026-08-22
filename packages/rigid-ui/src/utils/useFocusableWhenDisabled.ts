/**
 * Solid port of Base UI's `utils/useFocusableWhenDisabled`.
 *
 * Computes the attribute/handler props that keep a disabled part reachable by keyboard when
 * `focusableWhenDisabled` is set, and strips interactivity (`tabIndex="-1"`, native
 * `disabled`) otherwise. Pure function: callers re-invoke it whenever their parameters
 * change, exactly like re-reading the React memo.
 */

// The index signature keeps the bag assignable to `MergeableProps` at merge sites.
export interface FocusableWhenDisabledProps extends Record<string, any> {
  "aria-disabled"?: boolean | undefined;
  disabled?: boolean | undefined;
  onKeyDown(event: KeyboardEvent): void;
  tabIndex?: number | undefined;
}

export interface UseFocusableWhenDisabledParameters {
  /**
   * Whether the component should be focusable when disabled.
   * When `undefined`, composite items are focusable when disabled by default.
   */
  focusableWhenDisabled?: boolean | undefined;
  /** The disabled state of the component. */
  disabled: boolean;
  /** Whether this is a composite item or not. @default false */
  composite?: boolean | undefined;
  /** @default 0 */
  tabIndex?: number | undefined;
  /** @default true */
  isNativeButton: boolean;
}

export interface UseFocusableWhenDisabledReturnValue {
  props: FocusableWhenDisabledProps;
}

export function useFocusableWhenDisabled(
  parameters: UseFocusableWhenDisabledParameters,
): UseFocusableWhenDisabledReturnValue {
  const {
    focusableWhenDisabled,
    disabled,
    composite = false,
    tabIndex: tabIndexProp = 0,
    isNativeButton,
  } = parameters;

  const isFocusableComposite = composite && focusableWhenDisabled !== false;
  const isNonFocusableComposite = composite && focusableWhenDisabled === false;

  // we can't explicitly assign `undefined` to any of these props because it
  // would otherwise prevent subsequently merged props from setting them
  const additionalProps: FocusableWhenDisabledProps = {
    // allow Tabbing away from focusableWhenDisabled elements
    onKeyDown(event: KeyboardEvent) {
      if (disabled && focusableWhenDisabled && event.key !== "Tab") {
        event.preventDefault();
      }
    },
  };

  if (!composite) {
    additionalProps.tabIndex = tabIndexProp;

    if (!isNativeButton && disabled) {
      additionalProps.tabIndex = focusableWhenDisabled ? tabIndexProp : -1;
    }
  }

  if (
    (isNativeButton && (focusableWhenDisabled || isFocusableComposite)) ||
    (!isNativeButton && disabled)
  ) {
    additionalProps["aria-disabled"] = disabled;
  }

  if (isNativeButton && (!focusableWhenDisabled || isNonFocusableComposite)) {
    additionalProps.disabled = disabled;
  }

  return { props: additionalProps };
}
