import { createEffect, createSignal, createUniqueId, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import { ACTIVE_COMPOSITE_ITEM } from "../../internals/composite/constants";
import { createCompositeListItem } from "../../internals/composite/list/createCompositeListItem";
import { useCompositeRootContext } from "../../internals/composite/root/CompositeRootContext";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails";
import { REASONS } from "../../internals/reasons";
import { renderPart } from "../../internals/renderPart";
import { useButton } from "../../internals/use-button/useButton";
import { contains } from "../../utils/contains";
import type { PartProps } from "../../utils/domProps";
import type { TabsRootOrientation } from "../root/TabsRoot";
import { useTabsRootContext } from "../root/TabsRootContext";
import { tabsStateAttributesMapping } from "../root/stateAttributesMapping";
import { useTabsListContext } from "../list/TabsListContext";

export type TabsTabValue = unknown;

export type TabsTabActivationDirection = "left" | "right" | "up" | "down" | "none";

export interface TabsTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface TabsTabSize {
  width: number;
  height: number;
}

/** Live metadata a tab registers with the list. Every field is a getter. */
export interface TabsTabMetadata {
  readonly disabled: boolean;
  readonly id: string | undefined;
  readonly value: TabsTabValue;
}

export interface TabsTabState {
  /** Whether the component should ignore user interaction. */
  disabled: boolean;
  /** Whether the component is active. */
  active: boolean;
  /** The component orientation. */
  orientation: TabsRootOrientation;
  /** The direction used for tab activation. */
  tabActivationDirection: TabsTabActivationDirection;
}

export interface TabsTabProps extends Omit<
  PartProps<HTMLButtonElement, JSX.ButtonHTMLAttributes<HTMLButtonElement>, TabsTabState>,
  "value"
> {
  /** The value of the Tab. */
  value: TabsTabValue;
  /**
   * Whether the Tab is disabled.
   *
   * If the first Tab in a `<Tabs.List>` is disabled, it won't be selected initially; the next
   * enabled Tab is selected instead. Server rendering can't know which Tabs are disabled, so set
   * `defaultValue` or `value` on `<Tabs.Root>` to an enabled Tab's value there.
   */
  disabled?: boolean;
  /**
   * Whether the rendered element is a native `<button>`. Set to `false` when `render` replaces it
   * with something else, so button semantics are applied instead of assumed.
   * @default true
   */
  nativeButton?: boolean;
}

/**
 * An individual interactive tab button that toggles the corresponding panel.
 * Renders a `<button>` element.
 */
export function TabsTab(props: TabsTabProps) {
  const root = useTabsRootContext();
  const list = useTabsListContext();
  const composite = useCompositeRootContext()!;

  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = () => props.id || `rigid-ui-tab-${generatedId}`;
  const disabled = () => props.disabled ?? false;

  const [element, setElement] = createSignal<HTMLElement>();
  const metadata: TabsTabMetadata = {
    get disabled() {
      return disabled();
    },
    get id() {
      return id();
    },
    get value() {
      return props.value;
    },
  };
  const index = createCompositeListItem(element, metadata);

  const active = () => props.value === root.value();
  const isActiveNow = () => untrack(() => props.value) === root.latestValue();

  // Follows the rendered element, so a `render` prop that swaps the host stays observed.
  createEffect(element, (el) => (el ? list.registerTabResizeObserverElement(el) : undefined));

  // Keep the highlighted item on the active tab when the value changes from outside (controlled
  // mode). While focus is inside the list, leave roving focus where the user put it.
  createEffect(
    () => ({
      isActive: active(),
      itemIndex: index(),
      highlighted: composite.highlightedIndex(),
      isDisabled: disabled(),
    }),
    ({ isActive, itemIndex, highlighted, isDisabled }) => {
      if (!isActive || itemIndex < 0 || highlighted === itemIndex) {
        return;
      }
      const listElement = untrack(list.tabsListElement);
      if (listElement) {
        const focused = listElement.ownerDocument.activeElement;
        if (focused && contains(listElement, focused)) {
          return;
        }
      }
      // A disabled tab would interfere with keyboard navigation, so the tab stop stays on an
      // enabled tab even when a disabled one is selected.
      if (!isDisabled) {
        composite.onHighlightedIndexChange(itemIndex);
      }
    },
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: () => props.nativeButton ?? true,
    focusableWhenDisabled: true,
  });

  let isPressing = false;
  let isMainButton = false;

  function activate(event: Event) {
    root.onValueChange(
      untrack(() => props.value),
      createChangeEventDetails(REASONS.none, event, undefined, { activationDirection: "none" }),
    );
  }

  function onClick(event: MouseEvent) {
    // Secondary-button clicks (some browsers fire them) never activate.
    if (event.button !== 0 || isActiveNow() || untrack(disabled)) {
      return;
    }
    activate(event);
  }

  function onFocus(event: FocusEvent) {
    composite.onHighlightedIndexChange(untrack(index));

    if (isActiveNow() || untrack(disabled)) {
      return;
    }

    // Keyboard and touch focus activate, and so does a main-button mouse press.
    if (untrack(list.activateOnFocus) && (!isPressing || isMainButton)) {
      activate(event);
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (isActiveNow() || untrack(disabled)) {
      return;
    }

    isPressing = true;
    // Secondary presses (context menu, middle click) may focus the tab, but must not activate it.
    isMainButton = event.button === 0;

    // Registered for every button so a secondary press doesn't leave the tab stuck pressing.
    const doc = (event.currentTarget as Element).ownerDocument;
    function handlePointerEnd() {
      isPressing = false;
      isMainButton = false;
      doc.removeEventListener("pointerup", handlePointerEnd);
      doc.removeEventListener("pointercancel", handlePointerEnd);
    }
    doc.addEventListener("pointerup", handlePointerEnd);
    doc.addEventListener("pointercancel", handlePointerEnd);
  }

  const state = (): TabsTabState => ({
    disabled: disabled(),
    active: active(),
    orientation: root.orientation(),
    tabActivationDirection: root.tabActivationDirection(),
  });

  return renderPart<HTMLButtonElement, TabsTabState>("button", props, {
    state,
    stateAttributesMapping: tabsStateAttributesMapping,
    props: {
      role: "tab",
      get id() {
        return id();
      },
      get tabIndex() {
        return composite.highlightedIndex() === index() ? 0 : -1;
      },
      get "aria-controls"() {
        return root.getTabPanelIdByValue(props.value);
      },
      get "aria-selected"() {
        return active() ? "true" : "false";
      },
      get [ACTIVE_COMPOSITE_ITEM]() {
        return active() ? "" : undefined;
      },
      onClick,
      onFocus,
      onPointerDown,
    },
    propsGetter: getButtonProps,
    ref: [setElement, buttonRef as (element: HTMLButtonElement) => void],
    exclude: ["value", "disabled", "nativeButton", "id"],
  });
}

export namespace TabsTab {
  export type Value = TabsTabValue;
  export type ActivationDirection = TabsTabActivationDirection;
  export type Position = TabsTabPosition;
  export type Size = TabsTabSize;
  export type Metadata = TabsTabMetadata;
  export type State = TabsTabState;
  export type Props = TabsTabProps;
}
