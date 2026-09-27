import { isHTMLElement } from "@floating-ui/utils/dom";
import type { TextDirection } from "../direction-context";

/**
 * Solid port of the list helpers in Base UI's `internals/composite/composite.ts` and
 * `floating-ui-react/utils/composite.ts`.
 */

export type DisabledIndices = readonly number[] | ((index: number) => boolean);

export function isIndexOutOfListBounds(list: ReadonlyArray<HTMLElement | null>, index: number) {
  return index < 0 || index >= list.length;
}

function isHiddenByStyles(styles: CSSStyleDeclaration) {
  return styles.visibility === "hidden" || styles.visibility === "collapse";
}

export function isElementVisible(element: Element | null) {
  if (!element || !element.isConnected) {
    return false;
  }
  const styles = getComputedStyle(element);
  if (isHiddenByStyles(styles)) {
    return false;
  }
  if (typeof element.checkVisibility === "function") {
    return element.checkVisibility();
  }
  return styles.display !== "none" && styles.display !== "contents";
}

export function isListIndexDisabled(
  list: ReadonlyArray<HTMLElement | null>,
  index: number,
  disabledIndices?: DisabledIndices,
) {
  const isExplicitlyDisabled =
    typeof disabledIndices === "function"
      ? disabledIndices(index)
      : (disabledIndices?.includes(index) ?? false);

  if (isExplicitlyDisabled) {
    return true;
  }

  const element = list[index];
  if (!element) {
    return false;
  }

  if (!isElementVisible(element)) {
    return true;
  }

  // A natively disabled element can never receive focus, so it is always skipped. Only
  // `aria-disabled` items can be focusable while disabled.
  if (element.matches(":disabled")) {
    return true;
  }

  return (
    !disabledIndices &&
    (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true")
  );
}

export function findNonDisabledListIndex(
  list: ReadonlyArray<HTMLElement | null>,
  {
    startingIndex = -1,
    decrement = false,
    disabledIndices,
  }: {
    startingIndex?: number;
    decrement?: boolean;
    disabledIndices?: DisabledIndices;
  } = {},
): number {
  let index = startingIndex;
  do {
    index += decrement ? -1 : 1;
  } while (
    index >= 0 &&
    index <= list.length - 1 &&
    isListIndexDisabled(list, index, disabledIndices)
  );

  return index;
}

export function getMinListIndex(
  list: ReadonlyArray<HTMLElement | null>,
  disabledIndices?: DisabledIndices,
) {
  return findNonDisabledListIndex(list, { disabledIndices });
}

export function getMaxListIndex(
  list: ReadonlyArray<HTMLElement | null>,
  disabledIndices?: DisabledIndices,
) {
  return findNonDisabledListIndex(list, {
    decrement: true,
    startingIndex: list.length,
    disabledIndices,
  });
}

export function isNativeInput(
  element: EventTarget,
): element is HTMLElement & (HTMLInputElement | HTMLTextAreaElement) {
  if (isHTMLElement(element) && element.tagName === "INPUT") {
    return (element as HTMLInputElement).selectionStart != null;
  }
  return isHTMLElement(element) && element.tagName === "TEXTAREA";
}

export function scrollIntoViewIfNeeded(
  scrollContainer: HTMLElement | null,
  element: HTMLElement | null,
  direction: TextDirection,
  orientation: "horizontal" | "vertical" | "both",
) {
  if (!scrollContainer || !element || !element.scrollTo) {
    return;
  }

  let targetX = scrollContainer.scrollLeft;
  let targetY = scrollContainer.scrollTop;

  const isOverflowingX = scrollContainer.clientWidth < scrollContainer.scrollWidth;
  const isOverflowingY = scrollContainer.clientHeight < scrollContainer.scrollHeight;

  if (isOverflowingX && orientation !== "vertical") {
    const elementOffsetLeft = getOffset(scrollContainer, element, "left");
    const containerStyles = getStyles(scrollContainer);
    const elementStyles = getStyles(element);
    const overflowsRight =
      elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight >
      scrollContainer.scrollLeft + scrollContainer.clientWidth - containerStyles.scrollPaddingRight;
    const overflowsLeft =
      elementOffsetLeft - elementStyles.scrollMarginLeft <
      scrollContainer.scrollLeft + containerStyles.scrollPaddingLeft;
    const alignRight = () =>
      elementOffsetLeft +
      element.offsetWidth +
      elementStyles.scrollMarginRight -
      scrollContainer.clientWidth +
      containerStyles.scrollPaddingRight;
    const alignLeft = () =>
      elementOffsetLeft - elementStyles.scrollMarginLeft - containerStyles.scrollPaddingLeft;

    // RTL checks the leading (left) edge first, LTR the trailing (right) edge.
    if (direction === "ltr") {
      if (overflowsRight) targetX = alignRight();
      else if (overflowsLeft) targetX = alignLeft();
    } else if (overflowsLeft) {
      targetX = alignLeft();
    } else if (overflowsRight) {
      targetX = alignRight();
    }
  }

  if (isOverflowingY && orientation !== "horizontal") {
    const elementOffsetTop = getOffset(scrollContainer, element, "top");
    const containerStyles = getStyles(scrollContainer);
    const elementStyles = getStyles(element);

    if (
      elementOffsetTop - elementStyles.scrollMarginTop <
      scrollContainer.scrollTop + containerStyles.scrollPaddingTop
    ) {
      targetY = elementOffsetTop - elementStyles.scrollMarginTop - containerStyles.scrollPaddingTop;
    } else if (
      elementOffsetTop + element.offsetHeight + elementStyles.scrollMarginBottom >
      scrollContainer.scrollTop + scrollContainer.clientHeight - containerStyles.scrollPaddingBottom
    ) {
      targetY =
        elementOffsetTop +
        element.offsetHeight +
        elementStyles.scrollMarginBottom -
        scrollContainer.clientHeight +
        containerStyles.scrollPaddingBottom;
    }
  }

  scrollContainer.scrollTo({ left: targetX, top: targetY, behavior: "auto" });
}

function getOffset(ancestor: HTMLElement, element: HTMLElement, side: "left" | "top") {
  const propName = side === "left" ? "offsetLeft" : "offsetTop";
  let result = 0;
  let current = element;

  while (current.offsetParent) {
    result += current[propName];
    if (current.offsetParent === ancestor) {
      break;
    }
    current = current.offsetParent as HTMLElement;
  }

  return result;
}

function getStyles(element: HTMLElement) {
  const styles = getComputedStyle(element);
  return {
    scrollMarginTop: parseFloat(styles.scrollMarginTop) || 0,
    scrollMarginRight: parseFloat(styles.scrollMarginRight) || 0,
    scrollMarginBottom: parseFloat(styles.scrollMarginBottom) || 0,
    scrollMarginLeft: parseFloat(styles.scrollMarginLeft) || 0,
    scrollPaddingTop: parseFloat(styles.scrollPaddingTop) || 0,
    scrollPaddingRight: parseFloat(styles.scrollPaddingRight) || 0,
    scrollPaddingBottom: parseFloat(styles.scrollPaddingBottom) || 0,
    scrollPaddingLeft: parseFloat(styles.scrollPaddingLeft) || 0,
  };
}
