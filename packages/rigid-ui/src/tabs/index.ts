export * as Tabs from "./index.parts";
export type {
  TabsRootProps,
  TabsRootState,
  TabsRootOrientation,
  TabsRootChangeEventReason,
  TabsRootChangeEventDetails,
} from "./root/TabsRoot";
export type { TabsListProps, TabsListState } from "./list/TabsList";
export type {
  TabsTabProps,
  TabsTabState,
  TabsTabValue,
  TabsTabActivationDirection,
  TabsTabPosition,
  TabsTabSize,
  TabsTabMetadata,
} from "./tab/TabsTab";
export type { TabsPanelProps, TabsPanelState, TabsPanelMetadata } from "./panel/TabsPanel";
export type { TabsIndicatorProps, TabsIndicatorState } from "./indicator/TabsIndicator";
export { TabsRootDataAttributes } from "./root/TabsRootDataAttributes";
export { TabsListDataAttributes } from "./list/TabsListDataAttributes";
export { TabsTabDataAttributes } from "./tab/TabsTabDataAttributes";
export { TabsPanelDataAttributes } from "./panel/TabsPanelDataAttributes";
export { TabsIndicatorDataAttributes } from "./indicator/TabsIndicatorDataAttributes";
export { TabsIndicatorCssVars } from "./indicator/TabsIndicatorCssVars";
