import type { StateAttributesMapping } from "../../internals/getStateAttributesProps";
import type { TabsRootState } from "./TabsRoot";

export const tabsStateAttributesMapping: StateAttributesMapping<TabsRootState> = {
  tabActivationDirection: (dir) => ({ "data-activation-direction": dir }),
};
