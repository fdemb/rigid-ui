import { createEffect } from "solid-js";
import type { Accessor } from "solid-js";
import { makeEventPreventable, mergeProps, omitProps } from "../mergeProps";
import type { MergeableProps } from "../mergeProps";
import { useCompositeRootContext } from "../composite/root/CompositeRootContext";
import { useFocusableWhenDisabled } from "../../utils/useFocusableWhenDisabled";
import { dispatchClickWithModifiers } from "../../utils/dispatchClickWithModifiers";

/** Parameter values may be passed statically or as reactive accessors. */
type MaybeAccessor<T> = T | Accessor<T>;

function readValue<T>(value: MaybeAccessor<T | undefined>): T | undefined {
  return typeof value === "function" ? (value as Accessor<T | undefined>)() : value;
}

function isButtonElement(elem: Element | null): elem is HTMLButtonElement {
  return elem !== null && elem.tagName === "BUTTON";
}

function isValidLinkElement(elem: Element | null): elem is HTMLAnchorElement {
  return elem !== null && elem.tagName === "A" && Boolean((elem as HTMLAnchorElement).href);
}

export interface UseButtonParameters {
  /** Whether the button is disabled. */
  disabled?: MaybeAccessor<boolean | undefined>;
  /**
   * Whether the button should remain focusable when disabled.
   * When `undefined`, composite items are focusable when disabled by default.
   */
  focusableWhenDisabled?: MaybeAccessor<boolean | undefined>;
  /** @default 0 */
  tabIndex?: MaybeAccessor<number | undefined>;
  /**
   * Whether the element rendered is a native `<button>`; drives `type="button"` vs
   * `role="button"` and the keyboard activation strategy.
   */
  native?: MaybeAccessor<boolean | undefined>;
  /**
   * Overrides composite-item inference: when `undefined`, being rendered inside a
   * composite root marks this part as a composite item.
   */
  composite?: MaybeAccessor<boolean | undefined>;
}

export interface UseButtonReturnValue {
  getButtonProps: (externalProps?: MergeableProps) => MergeableProps;
  buttonRef: (element: HTMLElement | null) => void;
}

export function useButton(parameters: UseButtonParameters = {}): UseButtonReturnValue {
  const elementRef: { current: HTMLElement | null } = { current: null };

  const compositeRootContext = useCompositeRootContext(true);
  const isCompositeItem = (): boolean =>
    readValue(parameters.composite) ?? compositeRootContext !== undefined;
  const isNativeButton = (): boolean => readValue(parameters.native) ?? true;
  const isDisabled = (): boolean => readValue(parameters.disabled) ?? false;

  // handles a disabled composite button rendering another button, e.g.
  // <Toolbar.Button disabled render={<Menu.Trigger />} />
  // the `disabled` prop needs to pass through 2 `useButton`s then finally
  // delete the `disabled` attribute from DOM
  function updateDisabled() {
    const element = elementRef.current;

    if (!isButtonElement(element)) {
      return;
    }

    if (
      isCompositeItem() &&
      isDisabled() &&
      focusableWhenDisabledProps().disabled === undefined &&
      element.disabled
    ) {
      element.disabled = false;
    }
  }

  createEffect(
    () => [isDisabled(), readValue(parameters.focusableWhenDisabled), isCompositeItem()] as const,
    () => {
      updateDisabled();
    },
  );

  function checkNativeButtonUsage(element: HTMLElement) {
    if (import.meta.env.DEV) {
      const isButtonTag = isButtonElement(element);

      if (isNativeButton()) {
        if (!isButtonTag) {
          const message =
            "Base UI: A component that acts as a button expected a native <button> because the " +
            "`nativeButton` prop is true. Rendering a non-<button> removes native button " +
            "semantics, which can impact forms and accessibility. Use a real <button> in the " +
            "`render` prop, or set `nativeButton` to `false`. ";
          console.error(message);
        }
      } else if (isButtonTag) {
        const message =
          "Base UI: A component that acts as a button expected a non-<button> because the `nativeButton` " +
          "prop is false. Rendering a <button> keeps native behavior while Base UI applies " +
          "non-native attributes and handlers, which can add unintended extra attributes (such " +
          "as `role` or `aria-disabled`). Use a non-<button> in the `render` prop, or set " +
          "`nativeButton` to `true`. ";
        console.error(message);
      }
    }
  }

  const buttonRef = (element: HTMLElement | null) => {
    elementRef.current = element;
    if (element) {
      checkNativeButtonUsage(element);
    }
    updateDisabled();
  };

  function focusableWhenDisabledProps() {
    return useFocusableWhenDisabled({
      focusableWhenDisabled: readValue(parameters.focusableWhenDisabled),
      disabled: isDisabled(),
      composite: isCompositeItem(),
      tabIndex: readValue(parameters.tabIndex),
      isNativeButton: isNativeButton(),
    }).props;
  }

  function getButtonProps(externalProps: MergeableProps = {}): MergeableProps {
    // Read through `externalProps` at call time and hide the handled keys with `omit`, rather
    // than destructuring and spreading: a spread would snapshot every reactive getter in the bag.
    const externalOnClick = (event: MouseEvent) => externalProps.onClick?.(event);
    const externalOnMouseDown = (event: MouseEvent) => externalProps.onMouseDown?.(event);
    const externalOnKeyUp = (event: KeyboardEvent) => externalProps.onKeyUp?.(event);
    const externalOnKeyDown = (event: KeyboardEvent) => externalProps.onKeyDown?.(event);
    const externalOnPointerDown = (event: PointerEvent) => externalProps.onPointerDown?.(event);
    const otherExternalProps = omitProps(
      externalProps,
      "onClick",
      "onMouseDown",
      "onKeyUp",
      "onKeyDown",
      "onPointerDown",
    );

    return mergeProps(
      {
        onClick(event: MouseEvent) {
          if (isDisabled()) {
            event.preventDefault();
            return;
          }
          externalOnClick(event);
        },
        onMouseDown(event: MouseEvent) {
          if (!isDisabled()) {
            externalOnMouseDown(event);
          }
        },
        onKeyDown(event: KeyboardEvent) {
          if (isDisabled()) {
            return;
          }

          const guarded = makeEventPreventable(event);
          externalOnKeyDown(guarded);
          if (guarded.baseUIHandlerPrevented) {
            return;
          }

          const isCurrentTarget = event.target === event.currentTarget;
          const currentTarget = event.currentTarget as Element;
          const isButton = isButtonElement(currentTarget);
          const isLink = !isNativeButton() && isValidLinkElement(currentTarget);
          const shouldClick = isCurrentTarget && (isNativeButton() ? isButton : !isLink);
          const isEnterKey = event.key === "Enter";
          const isSpaceKey = event.key === " ";
          const role = currentTarget.getAttribute("role");
          const isTextNavigationRole =
            role?.startsWith("menuitem") || role === "option" || role === "gridcell";

          if (isCurrentTarget && isCompositeItem() && isSpaceKey) {
            if (event.defaultPrevented && isTextNavigationRole) {
              return;
            }

            event.preventDefault();

            // Only a native-mode item that isn't a real <button> is excluded.
            if (!isNativeButton() || isButton) {
              guarded.preventBaseUIHandler();
              dispatchClickWithModifiers(currentTarget, guarded);
            }

            return;
          }

          // Keyboard accessibility for native and non-native elements.
          if (!shouldClick || isNativeButton() || (!isSpaceKey && !isEnterKey)) {
            // Space activates links on keyup (`role="button"` semantics, matching the
            // composite path); prevent the page scroll Space would otherwise trigger.
            // Enter is left to the browser's native link activation.
            if (isCurrentTarget && isLink && isSpaceKey) {
              event.preventDefault();
            }
            return;
          }

          // Match native buttons: preventing the keydown's default cancels activation.
          if (event.defaultPrevented) {
            return;
          }

          event.preventDefault();

          if (isEnterKey) {
            guarded.preventBaseUIHandler();
            dispatchClickWithModifiers(currentTarget, guarded);
          }
        },
        onKeyUp(event: KeyboardEvent) {
          if (isDisabled()) {
            return;
          }

          // calling preventDefault in keyUp on <button> will not dispatch a click event if Space is pressed
          // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
          const guarded = makeEventPreventable(event);
          externalOnKeyUp(guarded);

          if (
            event.target === event.currentTarget &&
            isNativeButton() &&
            isCompositeItem() &&
            isButtonElement(event.currentTarget as HTMLElement) &&
            event.key === " "
          ) {
            event.preventDefault();
            return;
          }

          if (guarded.baseUIHandlerPrevented) {
            return;
          }

          // Keyboard accessibility for non interactive elements.
          // Match native buttons: preventing the keyup's default cancels Space activation.
          // Limitation: unlike a native <button>, a prevented *keydown* cannot cancel the
          // activation — no state is kept between keydown and keyup, so we can't tell
          // whether the keydown was prevented or even happened on this element.
          if (
            event.target === event.currentTarget &&
            !isNativeButton() &&
            !isCompositeItem() &&
            !event.defaultPrevented &&
            event.key === " "
          ) {
            guarded.preventBaseUIHandler();
            dispatchClickWithModifiers(event.currentTarget as Element, guarded);
          }
        },
        onPointerDown(event: PointerEvent) {
          if (isDisabled()) {
            event.preventDefault();
            return;
          }
          externalOnPointerDown(event);
        },
      },
      isNativeButton() ? { type: "button" } : { role: "button" },
      focusableWhenDisabledProps(),
      otherExternalProps,
    );
  }

  return {
    getButtonProps,
    buttonRef,
  };
}
