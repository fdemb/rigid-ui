import { createEffect, createSignal, createUniqueId, onCleanup, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { createCompositeListItem } from "../../internals/composite/list/createCompositeListItem";
import { createOpenChangeComplete } from "../../internals/createOpenChangeComplete";
import {
  createTransitionStatus,
  type TransitionStatus,
} from "../../internals/createTransitionStatus";
import type { StateAttributesMapping } from "../../internals/getStateAttributesProps";
import { renderPart } from "../../internals/renderPart";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping";
import type { PartProps } from "../../utils/domProps";
import type { TabsRootState } from "../root/TabsRoot";
import { useTabsRootContext } from "../root/TabsRootContext";
import { tabsStateAttributesMapping } from "../root/stateAttributesMapping";
import type { TabsTabValue } from "../tab/TabsTab";

export interface TabsPanelMetadata {
  readonly value: TabsTabValue;
}

export interface TabsPanelState extends TabsRootState {
  /** Whether the component is hidden. */
  hidden: boolean;
  /** The transition status of the component. */
  transitionStatus: TransitionStatus;
}

export interface TabsPanelProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  TabsPanelState
> {
  /** The value of the panel. It is shown when the Tab with the same value is active. */
  value: TabsTabValue;
  /**
   * Whether to keep the element in the DOM while the panel is hidden.
   * @default false
   */
  keepMounted?: boolean;
}

const stateAttributesMapping: StateAttributesMapping<TabsPanelState> = {
  ...tabsStateAttributesMapping,
  ...transitionStatusMapping,
};

/**
 * A panel displayed when the corresponding tab is active.
 * Renders a `<div>` element.
 */
export function TabsPanel(props: TabsPanelProps) {
  const root = useTabsRootContext();
  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = () => props.id || `rigid-ui-tab-panel-${generatedId}`;

  const open = () => props.value === root.value();
  const { mounted, transitionStatus, setMounted } = createTransitionStatus(open);
  const hidden = () => !mounted();
  const keepMounted = () => props.keepMounted ?? false;

  const [element, setElement] = createSignal<HTMLElement>();
  const index = createCompositeListItem<TabsPanelMetadata>(element, {
    get value() {
      return props.value;
    },
  });

  createOpenChangeComplete({
    open,
    element,
    onComplete() {
      if (!open()) {
        setMounted(false);
      }
    },
  });

  createEffect(
    () => ({ panelValue: props.value, panelId: id(), register: !hidden() || keepMounted() }),
    ({ panelValue, panelId, register }) =>
      register ? root.registerMountedTabPanel(panelValue, panelId) : undefined,
  );

  const state = (): TabsPanelState => ({
    hidden: hidden(),
    orientation: root.orientation(),
    tabActivationDirection: root.tabActivationDirection(),
    transitionStatus: transitionStatus(),
  });

  return <Show when={keepMounted() || mounted()}>{(_visible) => renderPanel()}</Show>;

  function renderPanel() {
    // An unmounted panel leaves the composite list.
    onCleanup(() => setElement(undefined));
    return renderPart<HTMLDivElement, TabsPanelState>("div", props, {
      state,
      stateAttributesMapping,
      ref: (el: HTMLDivElement) => setElement(el),
      props: {
        role: "tabpanel",
        get id() {
          return id();
        },
        get hidden() {
          return hidden();
        },
        get "aria-labelledby"() {
          return root.getTabIdByPanelValue(props.value);
        },
        get tabIndex() {
          return open() ? 0 : -1;
        },
        get inert() {
          return open() ? undefined : true;
        },
        get "data-index"() {
          return index();
        },
      },
      exclude: ["value", "keepMounted", "id"],
    });
  }
}

export namespace TabsPanel {
  export type Metadata = TabsPanelMetadata;
  export type State = TabsPanelState;
  export type Props = TabsPanelProps;
}
