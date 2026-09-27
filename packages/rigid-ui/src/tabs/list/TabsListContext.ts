import { createContext, useContext, type Accessor } from "solid-js";

export interface TabsListContextValue {
  activateOnFocus: Accessor<boolean>;
  registerIndicatorUpdateListener(listener: () => void): () => void;
  registerTabResizeObserverElement(element: HTMLElement): () => void;
  tabsListElement: Accessor<HTMLElement | undefined>;
}

export const TabsListContext = createContext<TabsListContextValue | null>(null);

export function useTabsListContext() {
  const context = useContext(TabsListContext);
  if (!context) {
    throw new Error(
      "Rigid UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.",
    );
  }
  return context;
}
