import { createContext, useContext, type Accessor } from "solid-js";
import type { CompositeList } from "../../internals/composite/list/CompositeList";
import type { TabsRootChangeEventDetails, TabsRootOrientation } from "./TabsRoot";
import type { TabsTabActivationDirection, TabsTabMetadata, TabsTabValue } from "../tab/TabsTab";

export interface TabsRootContextValue {
  /** The currently active tab's value, for rendering. */
  value: Accessor<TabsTabValue>;
  /**
   * The active value as of the latest change, including one not yet flushed. Event handlers
   * read this so two events in one tick do not both act on a stale value.
   */
  latestValue(): TabsTabValue;
  onValueChange(value: TabsTabValue, eventDetails: TabsRootChangeEventDetails): void;
  orientation: Accessor<TabsRootOrientation>;
  tabActivationDirection: Accessor<TabsTabActivationDirection>;
  /** Registry of `Tabs.Tab` elements, provided to the tabs by `Tabs.List`. */
  tabList: CompositeList<TabsTabMetadata>;
  getTabElementBySelectedValue(selectedValue: TabsTabValue): HTMLElement | null;
  getTabIdByPanelValue(panelValue: TabsTabValue): string | undefined;
  getTabPanelIdByValue(tabValue: TabsTabValue): string | undefined;
  registerMountedTabPanel(panelValue: TabsTabValue, panelId: string): () => void;
}

export const TabsRootContext = createContext<TabsRootContextValue | null>(null);

export function useTabsRootContext() {
  const context = useContext(TabsRootContext);
  if (!context) {
    throw new Error(
      "Rigid UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.",
    );
  }
  return context;
}
