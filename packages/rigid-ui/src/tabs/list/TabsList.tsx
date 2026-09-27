import { createSignal, onCleanup, onSettled } from "solid-js";
import type { JSX } from "@solidjs/web";
import { CompositeListContext } from "../../internals/composite/list/CompositeListContext";
import { createCompositeRoot } from "../../internals/composite/root/createCompositeRoot";
import {
  CompositeRootContext,
  type CompositeRootContextValue,
} from "../../internals/composite/root/CompositeRootContext";
import { useDirection } from "../../internals/direction-context";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import type { TabsRootState } from "../root/TabsRoot";
import { useTabsRootContext } from "../root/TabsRootContext";
import { tabsStateAttributesMapping } from "../root/stateAttributesMapping";
import { TabsListContext, type TabsListContextValue } from "./TabsListContext";

export interface TabsListState extends TabsRootState {}

export interface TabsListProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  TabsListState
> {
  /**
   * Whether to change the active tab when arrow keys move focus. Otherwise, tabs are activated
   * with <kbd>Enter</kbd> or <kbd>Space</kbd>.
   * @default false
   */
  activateOnFocus?: boolean;
  /**
   * Whether arrow-key focus wraps from the last tab to the first, and back.
   * @default true
   */
  loopFocus?: boolean;
}

/**
 * Groups the individual tab buttons.
 * Renders a `<div>` element.
 */
export function TabsList(props: TabsListProps) {
  const root = useTabsRootContext();
  const direction = useDirection();
  const [tabsListElement, setTabsListElement] = createSignal<HTMLElement>();

  const composite = createCompositeRoot({
    map: root.tabList.map,
    elements: root.tabList.elements,
    rootElement: tabsListElement,
    direction,
    orientation: root.orientation,
    loopFocus: () => props.loopFocus ?? true,
    enableHomeAndEndKeys: true,
    // Tabs stay focusable when disabled, so only natively disabled or hidden tabs are skipped.
    disabledIndices: [],
  });

  const indicatorUpdateListeners = new Set<() => void>();
  const observedTabs = new Set<HTMLElement>();
  let resizeObserver: ResizeObserver | null = null;

  onSettled(() => {
    if (typeof ResizeObserver === "undefined") return;
    resizeObserver = new ResizeObserver(() => {
      indicatorUpdateListeners.forEach((listener) => listener());
    });
    const list = tabsListElement();
    if (list) resizeObserver.observe(list);
    observedTabs.forEach((element) => resizeObserver?.observe(element));
    return () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
    };
  });

  const listContext: TabsListContextValue = {
    activateOnFocus: () => props.activateOnFocus ?? false,
    registerIndicatorUpdateListener(listener) {
      indicatorUpdateListeners.add(listener);
      return () => indicatorUpdateListeners.delete(listener);
    },
    registerTabResizeObserverElement(element) {
      observedTabs.add(element);
      resizeObserver?.observe(element);
      return () => {
        observedTabs.delete(element);
        resizeObserver?.unobserve(element);
      };
    },
    tabsListElement,
  };

  const compositeContext: CompositeRootContextValue = {
    highlightedIndex: composite.highlightedIndex,
    onHighlightedIndexChange: composite.onHighlightedIndexChange,
    highlightItemOnHover: () => false,
  };

  onCleanup(() => indicatorUpdateListeners.clear());

  const state = (): TabsListState => ({
    orientation: root.orientation(),
    tabActivationDirection: root.tabActivationDirection(),
  });

  return (
    <TabsListContext value={listContext}>
      <CompositeRootContext value={compositeContext}>
        <CompositeListContext value={root.tabList}>
          {renderPart<HTMLDivElement, TabsListState>("div", props, {
            state,
            stateAttributesMapping: tabsStateAttributesMapping,
            ref: setTabsListElement,
            props: {
              role: "tablist",
              get "aria-orientation"() {
                return root.orientation() === "vertical" ? "vertical" : undefined;
              },
              onKeyDown: composite.onKeyDown,
              onFocus: composite.onFocus,
            },
            exclude: ["activateOnFocus", "loopFocus"],
          })}
        </CompositeListContext>
      </CompositeRootContext>
    </TabsListContext>
  );
}

export namespace TabsList {
  export type Props = TabsListProps;
  export type State = TabsListState;
}
