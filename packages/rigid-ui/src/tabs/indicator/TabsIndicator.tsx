import { createEffect, createSignal, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { getParentNode, isHTMLElement, isLastTraversableNode } from "@floating-ui/utils/dom";
import { renderPart } from "../../internals/renderPart";
import { getCssDimensions } from "../../utils/getCssDimensions";
import { getElementTransform } from "../../utils/getElementTransform";
import type { PartProps } from "../../utils/domProps";
import type { TabsRootOrientation, TabsRootState } from "../root/TabsRoot";
import { useTabsRootContext } from "../root/TabsRootContext";
import { tabsStateAttributesMapping } from "../root/stateAttributesMapping";
import { useTabsListContext } from "../list/TabsListContext";
import type { TabsTabPosition, TabsTabSize } from "../tab/TabsTab";

export interface TabsIndicatorState extends TabsRootState {
  /** The active tab position. */
  activeTabPosition: TabsTabPosition | null;
  /** The active tab size. */
  activeTabSize: TabsTabSize | null;
  /** The component orientation. */
  orientation: TabsRootOrientation;
}

export interface TabsIndicatorProps extends PartProps<
  HTMLSpanElement,
  JSX.HTMLAttributes<HTMLSpanElement>,
  TabsIndicatorState
> {}

const stateAttributesMapping = {
  ...tabsStateAttributesMapping,
  activeTabPosition: () => null,
  activeTabSize: () => null,
};

// `offsetLeft`/`offsetTop` are rounded to whole pixels and the error can compound across the
// offset parent chain.
const MAX_LAYOUT_ROUNDING_ERROR = 2;

interface Measurement {
  position: TabsTabPosition;
  size: TabsTabSize;
}

/**
 * A visual indicator that can be styled to match the position of the currently active tab.
 * Renders a `<span>` element.
 */
export function TabsIndicator(props: TabsIndicatorProps) {
  const root = useTabsRootContext();
  const list = useTabsListContext();

  const [resizeTick, setResizeTick] = createSignal(0);
  const [measurement, setMeasurement] = createSignal<Measurement | null>(null);

  createEffect(
    () => true,
    () => list.registerIndicatorUpdateListener(() => setResizeTick((tick) => tick + 1)),
  );

  // Measured after the DOM commits, so the active tab's own styling has applied.
  createEffect(
    () => {
      resizeTick();
      const value = root.value();
      const tabsListElement = list.tabsListElement();
      const activeTab = value != null ? root.getTabElementBySelectedValue(value) : null;
      return { tabsListElement, activeTab };
    },
    ({ tabsListElement, activeTab }) => {
      setMeasurement(tabsListElement && activeTab ? measure(activeTab, tabsListElement) : null);
    },
  );

  const state = (): TabsIndicatorState => {
    const current = measurement();
    return {
      orientation: root.orientation(),
      tabActivationDirection: root.tabActivationDirection(),
      activeTabPosition: current?.position ?? null,
      activeTabSize: current?.size ?? null,
    };
  };

  return (
    <Show when={root.value() != null}>
      {renderPart<HTMLSpanElement, TabsIndicatorState>("span", props, {
        state,
        stateAttributesMapping,
        props: {
          role: "presentation",
          get hidden() {
            // Stay hidden until the layout has settled.
            const current = measurement();
            return !(current && current.size.width > 0 && current.size.height > 0);
          },
          get style() {
            const current = measurement();
            if (!current) return undefined;
            const { position, size } = current;
            return {
              "--active-tab-left": `${position.left}px`,
              "--active-tab-right": `${position.right}px`,
              "--active-tab-top": `${position.top}px`,
              "--active-tab-bottom": `${position.bottom}px`,
              "--active-tab-width": `${size.width}px`,
              "--active-tab-height": `${size.height}px`,
            };
          },
        },
      })}
    </Show>
  );
}

function measure(activeTab: HTMLElement, tabsListElement: HTMLElement): Measurement {
  const { width, height } = getCssDimensions(activeTab);
  const { width: tabListWidth, height: tabListHeight } = getCssDimensions(tabsListElement);
  const tabRect = activeTab.getBoundingClientRect();
  const tabsListRect = tabsListElement.getBoundingClientRect();
  const scaleX = tabListWidth > 0 ? tabsListRect.width / tabListWidth : 1;
  const scaleY = tabListHeight > 0 ? tabsListRect.height / tabListHeight : 1;

  // Layout offsets are immune to transforms, but lose sub-pixel precision.
  let { left, top } = getLayoutOffset(activeTab, tabsListElement);

  const rectLeft =
    (tabRect.left - tabsListRect.left) / scaleX +
    tabsListElement.scrollLeft -
    tabsListElement.clientLeft;
  const rectTop =
    (tabRect.top - tabsListRect.top) / scaleY +
    tabsListElement.scrollTop -
    tabsListElement.clientTop;

  // The rect-based offset is sub-pixel precise but comes from projected viewport geometry, which
  // a rotation, skew, flip, or 3D transform warps beyond what dividing by the scale undoes. When
  // it agrees with the layout offset (up to rounding), no such transform is in effect and the
  // precise value is safe. A list scaled to zero yields NaN here and fails the same check.
  //
  // The active tab's own translation moves the rect but not the layout offset, so strip it before
  // comparing. That lets the indicator follow tab-local animations.
  const tabTranslation = getActiveTabTranslation(activeTab);
  if (
    Math.abs(rectLeft - tabTranslation.x - left) <= MAX_LAYOUT_ROUNDING_ERROR &&
    Math.abs(rectTop - tabTranslation.y - top) <= MAX_LAYOUT_ROUNDING_ERROR
  ) {
    left = rectLeft;
    top = rectTop;
  }

  return {
    position: {
      left,
      top,
      right: tabsListElement.scrollWidth - left - width,
      bottom: tabsListElement.scrollHeight - top - height,
    },
    size: { width, height },
  };
}

function getLayoutOffset(element: HTMLElement, ancestor: HTMLElement) {
  const elementOffset = getCumulativeOffset(element);
  const ancestorOffset = getCumulativeOffset(ancestor);

  let left = elementOffset.left - ancestorOffset.left - ancestor.clientLeft;
  let top = elementOffset.top - ancestorOffset.top - ancestor.clientTop;

  // Scrolling doesn't change layout, so a scroll container between the tab and the list moves the
  // tab on screen while its layout slot stays put. Subtract that scroll to keep this comparable
  // with the rect-based offset. The list's own scroll is excluded: the indicator scrolls with it.
  let node: Node | null = getParentNode(element);
  while (isHTMLElement(node) && node !== ancestor && !isLastTraversableNode(node)) {
    left -= node.scrollLeft;
    top -= node.scrollTop;
    node = getParentNode(node);
  }

  return { left, top };
}

function getCumulativeOffset(element: HTMLElement) {
  let left = 0;
  let top = 0;
  let currentElement: HTMLElement | null = element;

  while (currentElement != null) {
    left += currentElement.offsetLeft;
    top += currentElement.offsetTop;

    const offsetParent = currentElement.offsetParent as HTMLElement | null;
    if (offsetParent != null) {
      left += offsetParent.clientLeft;
      top += offsetParent.clientTop;
    }

    currentElement = offsetParent;
  }

  return { left, top };
}

// The active tab's own 2D translation: the translation part of the computed `transform` plus the
// `translate` longhand. Adding them is exact only without rotation or scale, and with either of
// those present the caller's agreement check rejects the rect-based offset anyway.
function getActiveTabTranslation(element: HTMLElement) {
  const computedStyle = getComputedStyle(element);
  const { x, y } = getElementTransform(element, computedStyle);
  let translateX = x;
  let translateY = y;

  // `getComputedStyle` resolves absolute lengths to pixels but keeps percentages, which resolve
  // against the tab's border box.
  const { translate } = computedStyle;
  if (translate && translate !== "none") {
    const parts = translate.split(" ");
    translateX += resolveTranslateLength(parts[0], element.offsetWidth);
    translateY += resolveTranslateLength(parts[1], element.offsetHeight);
  }

  return { x: translateX, y: translateY };
}

// Anything other than a plain number or percentage (e.g. `calc(...)`) counts as no translation,
// so the indicator falls back to the tab's layout slot rather than guessing.
function resolveTranslateLength(value: string | undefined, referenceSize: number): number {
  if (!value) {
    return 0;
  }
  const numeric = parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return value.endsWith("%") ? (numeric / 100) * referenceSize : numeric;
}

export namespace TabsIndicator {
  export type State = TabsIndicatorState;
  export type Props = TabsIndicatorProps;
}
