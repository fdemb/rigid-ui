import { createEffect, createMemo, createSignal, untrack } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  createCompositeList,
  type CompositeListMap,
} from "../../internals/composite/list/CompositeList";
import { CompositeListContext } from "../../internals/composite/list/CompositeListContext";
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from "../../internals/createBaseUIEventDetails";
import { REASONS } from "../../internals/reasons";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import type { TabsTabActivationDirection, TabsTabMetadata, TabsTabValue } from "../tab/TabsTab";
import type { TabsPanelMetadata } from "../panel/TabsPanel";
import { TabsRootContext, type TabsRootContextValue } from "./TabsRootContext";
import { tabsStateAttributesMapping } from "./stateAttributesMapping";

type TabMap = CompositeListMap<TabsTabMetadata>;

export type TabsRootOrientation = "horizontal" | "vertical";

export interface TabsRootState {
  /** The component orientation. */
  orientation: TabsRootOrientation;
  /** The direction used for tab activation. */
  tabActivationDirection: TabsTabActivationDirection;
}

export type TabsRootChangeEventReason =
  | typeof REASONS.none
  | typeof REASONS.disabled
  | typeof REASONS.missing
  | typeof REASONS.initial;

export type TabsRootChangeEventDetails = BaseUIChangeEventDetails<
  TabsRootChangeEventReason,
  { activationDirection: TabsTabActivationDirection }
>;

export interface TabsRootProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  TabsRootState
> {
  /**
   * The value of the currently active `Tab`. Use when the component is controlled.
   * When the value is `null`, no Tab will be active.
   */
  value?: TabsTabValue;
  /**
   * The default value. Use when the component is not controlled.
   * When the value is `null`, no Tab will be active.
   * @default 0
   */
  defaultValue?: TabsTabValue;
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation?: TabsRootOrientation;
  /**
   * Called when the value changes.
   *
   * The `reason` is `'none'` for user-initiated changes (a click or keyboard navigation);
   * `'initial'` for the first automatic selection in an uncontrolled root without a
   * `defaultValue`; `'disabled'` when an uncontrolled root falls back because the selected tab
   * became disabled; and `'missing'` when the selected tab is removed or an explicit
   * `defaultValue` never matches a tab. Automatic changes can report `null` and cannot be
   * canceled.
   */
  onValueChange?: (value: TabsTabValue, eventDetails: TabsRootChangeEventDetails) => void;
}

/**
 * Groups the tabs and the corresponding panels.
 * Renders a `<div>` element.
 */
export function TabsRoot(props: TabsRootProps) {
  const orientation = () => props.orientation ?? "horizontal";
  const isControlled = () => props.value !== undefined;

  // Wrapped in objects so a function value is stored rather than called as an updater.
  const initialDefaultValue: TabsTabValue = untrack(() =>
    props.defaultValue === undefined ? 0 : props.defaultValue,
  );
  const hasExplicitDefaultValue = untrack(() => props.defaultValue !== undefined);
  const [uncontrolledValue, setUncontrolledValue] = createSignal<{ value: TabsTabValue }>({
    value: initialDefaultValue,
  });
  let latestUncontrolledValue = initialDefaultValue;

  const value = createMemo<TabsTabValue>(() =>
    isControlled() ? props.value : uncontrolledValue().value,
  );
  const latestValue = () =>
    untrack(isControlled) ? untrack(() => props.value) : latestUncontrolledValue;

  function setValue(next: TabsTabValue) {
    latestUncontrolledValue = next;
    setUncontrolledValue({ value: next });
  }

  const tabList = createCompositeList<TabsTabMetadata>();
  const panelList = createCompositeList<TabsPanelMetadata>();
  const tabMap = tabList.map;

  const [mountedTabPanels, setMountedTabPanels] = createSignal<Map<TabsTabValue, string>>(
    new Map(),
  );

  // Activation direction is derived from where the new tab sits relative to the previous one.
  // `previousValue` stays stale while the new tab is not registered yet, so the direction is
  // recomputed from DOM positions once it is.
  let previousValue: TabsTabValue = untrack(value);
  let committedDirection: TabsTabActivationDirection = "none";
  // Automatic fallbacks are not directional transitions.
  let resetDirectionFor: { value: TabsTabValue } | null = null;

  const tabActivationDirection = createMemo<TabsTabActivationDirection>(() => {
    const current = value();
    const map = tabMap();
    if (resetDirectionFor && resetDirectionFor.value === current) {
      resetDirectionFor = null;
      previousValue = current;
      committedDirection = "none";
      return committedDirection;
    }
    if (previousValue !== current) {
      committedDirection = computeActivationDirection(
        previousValue,
        current,
        untrack(orientation),
        map,
      );
      const incomplete =
        previousValue != null && current != null && findTabElement(map, current) == null;
      if (!incomplete) {
        previousValue = current;
      }
    }
    return committedDirection;
  });

  function onValueChange(newValue: TabsTabValue, eventDetails: TabsRootChangeEventDetails) {
    eventDetails.activationDirection = computeActivationDirection(
      latestValue(),
      newValue,
      untrack(orientation),
      untrack(tabMap),
    );

    props.onValueChange?.(newValue, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    if (!untrack(isControlled)) {
      setValue(newValue);
    }
  }

  function notifyAutomaticValueChange(nextValue: TabsTabValue, reason: TabsRootChangeEventReason) {
    props.onValueChange?.(
      nextValue,
      createChangeEventDetails(reason, undefined, undefined, { activationDirection: "none" }),
    );
  }

  function registerMountedTabPanel(panelValue: TabsTabValue, panelId: string) {
    setMountedTabPanels((prev) => new Map(prev).set(panelValue, panelId));
    return () => {
      setMountedTabPanels((prev) => {
        // Another panel with the same value took ownership in the meantime.
        if (prev.get(panelValue) !== panelId) {
          return prev;
        }
        const next = new Map(prev);
        next.delete(panelValue);
        return next;
      });
    };
  }

  function getTabIdByPanelValue(panelValue: TabsTabValue) {
    for (const entry of tabMap().values()) {
      if (entry.metadata.value === panelValue) {
        return entry.metadata.id;
      }
    }
    return undefined;
  }

  const selectedTabMetadata = createMemo(() => {
    const current = value();
    for (const entry of tabMap().values()) {
      if (entry.metadata.value === current) {
        return entry.metadata;
      }
    }
    return undefined;
  });

  const firstEnabledTabValue = createMemo(() => {
    for (const entry of tabMap().values()) {
      if (!entry.metadata.disabled) {
        return { value: entry.metadata.value };
      }
    }
    return undefined;
  });

  // Implicit uncontrolled selections are still automatic changes, so notify once when the tabs
  // first register. Explicit defaults are treated as user-owned.
  let shouldNotifyInitialValueChange = !hasExplicitDefaultValue;
  // An explicit defaultValue can intentionally point at a disabled tab on mount. Once that
  // selection becomes valid, later disabled states fall back.
  let shouldHonorDisabledDefaultValue = hasExplicitDefaultValue;
  let didRegisterTabs = false;
  let lastKnownTabElement: HTMLElement | undefined;

  // Uncontrolled roots own automatic fallback. Controlled roots keep the exact value supplied by
  // the parent, even when that tab is disabled or missing.
  createEffect(
    () => ({
      controlled: isControlled(),
      map: tabMap(),
      current: value(),
      selectedDisabled: selectedTabMetadata()?.disabled,
      hasSelected: selectedTabMetadata() != null,
      fallback: firstEnabledTabValue(),
    }),
    ({ controlled, map, current, selectedDisabled, hasSelected, fallback }) => {
      if (controlled) {
        return;
      }

      function commitAutomaticValueChange(
        fallbackValue: TabsTabValue,
        reason: TabsRootChangeEventReason,
      ) {
        resetDirectionFor = { value: fallbackValue };
        setValue(fallbackValue);
        notifyAutomaticValueChange(fallbackValue, reason);
        shouldNotifyInitialValueChange = false;
      }

      if (map.size === 0) {
        if (didRegisterTabs && current !== null && !lastKnownTabElement?.isConnected) {
          commitAutomaticValueChange(null, REASONS.missing);
        }
        return;
      }

      didRegisterTabs = true;
      lastKnownTabElement = map.keys().next().value;

      const selectionIsMissing = !hasSelected && current !== null;

      if (!selectedDisabled && current === initialDefaultValue) {
        shouldHonorDisabledDefaultValue = false;
      }

      if (shouldHonorDisabledDefaultValue && selectedDisabled && current === initialDefaultValue) {
        return;
      }

      if (selectedDisabled || selectionIsMissing) {
        const fallbackValue = fallback ? fallback.value : null;

        if (current === fallbackValue) {
          shouldNotifyInitialValueChange = false;
          return;
        }

        let reason: TabsRootChangeEventReason = REASONS.missing;
        if (shouldNotifyInitialValueChange) {
          reason = REASONS.initial;
        } else if (selectedDisabled) {
          reason = REASONS.disabled;
        }

        commitAutomaticValueChange(fallbackValue, reason);
        return;
      }

      if (shouldNotifyInitialValueChange && hasSelected) {
        notifyAutomaticValueChange(current, REASONS.initial);
        shouldNotifyInitialValueChange = false;
      }
    },
  );

  const context: TabsRootContextValue = {
    value,
    latestValue,
    onValueChange,
    orientation,
    tabActivationDirection,
    tabList,
    getTabElementBySelectedValue: (selectedValue) => findTabElement(tabMap(), selectedValue),
    getTabIdByPanelValue,
    getTabPanelIdByValue: (tabValue) => mountedTabPanels().get(tabValue),
    registerMountedTabPanel,
  };

  const state = (): TabsRootState => ({
    orientation: orientation(),
    tabActivationDirection: tabActivationDirection(),
  });

  return (
    <TabsRootContext value={context}>
      <CompositeListContext value={panelList}>
        {renderPart<HTMLDivElement, TabsRootState>("div", props, {
          state,
          stateAttributesMapping: tabsStateAttributesMapping,
          exclude: ["value", "defaultValue", "orientation", "onValueChange"],
        })}
      </CompositeListContext>
    </TabsRootContext>
  );
}

function findTabElement(map: TabMap, value: TabsTabValue): HTMLElement | null {
  for (const [element, entry] of map) {
    if (entry.metadata.value === value) {
      return element;
    }
  }
  return null;
}

function computeActivationDirection(
  oldValue: TabsTabValue,
  newValue: TabsTabValue,
  orientation: TabsRootOrientation,
  map: TabMap,
): TabsTabActivationDirection {
  if (oldValue == null || newValue == null) {
    return "none";
  }

  const [positionProp, backward, forward] =
    orientation === "horizontal"
      ? (["left", "left", "right"] as const)
      : (["top", "up", "down"] as const);

  const oldTab = findTabElement(map, oldValue);
  const newTab = findTabElement(map, newValue);

  if (oldTab == null || newTab == null) {
    // A tab added and selected in the same update is not registered yet, so infer the
    // direction from comparable values.
    if (
      oldTab !== newTab &&
      (typeof oldValue === "number" || typeof oldValue === "string") &&
      typeof oldValue === typeof newValue
    ) {
      return newValue > oldValue ? forward : backward;
    }
    return "none";
  }

  const oldPosition = oldTab.getBoundingClientRect()[positionProp];
  const newPosition = newTab.getBoundingClientRect()[positionProp];

  if (newPosition < oldPosition) {
    return backward;
  }
  if (newPosition > oldPosition) {
    return forward;
  }
  return "none";
}

export namespace TabsRoot {
  export type Props = TabsRootProps;
  export type State = TabsRootState;
  export type Orientation = TabsRootOrientation;
  export type ChangeEventReason = TabsRootChangeEventReason;
  export type ChangeEventDetails = TabsRootChangeEventDetails;
}
