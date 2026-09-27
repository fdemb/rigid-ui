import { createEffect, createSignal, untrack, type Accessor } from "solid-js";
import { getTarget } from "../../../utils/getTarget";
import type { TextDirection } from "../../direction-context";
import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  ACTIVE_COMPOSITE_ITEM,
  COMPOSITE_KEYS,
  END,
  HOME,
  MODIFIER_KEYS,
  type ModifierKey,
} from "../constants";
import {
  findNonDisabledListIndex,
  getMaxListIndex,
  getMinListIndex,
  isIndexOutOfListBounds,
  isListIndexDisabled,
  isNativeInput,
  scrollIntoViewIfNeeded,
  type DisabledIndices,
} from "../composite";
import type { CompositeListMap } from "../list/CompositeList";

/**
 * Solid port of Base UI's `internals/composite/root/useCompositeRoot.ts`, without grid
 * navigation. Handlers read the highlighted index from a plain variable: a keydown fired right
 * after a focus event must see the index that focus just set, which a signal would not expose
 * until the next flush.
 */
export interface CreateCompositeRootParameters {
  map: Accessor<CompositeListMap<unknown>>;
  elements: Accessor<HTMLElement[]>;
  rootElement: Accessor<HTMLElement | undefined>;
  direction: Accessor<TextDirection>;
  orientation: Accessor<"horizontal" | "vertical" | "both">;
  loopFocus: Accessor<boolean>;
  enableHomeAndEndKeys?: boolean;
  stopEventPropagation?: boolean;
  disabledIndices?: DisabledIndices;
  modifierKeys?: readonly ModifierKey[];
}

export interface CompositeRoot {
  highlightedIndex: Accessor<number>;
  onHighlightedIndexChange: (index: number, shouldScrollIntoView?: boolean) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
}

export function createCompositeRoot(params: CreateCompositeRootParameters): CompositeRoot {
  const {
    enableHomeAndEndKeys = false,
    stopEventPropagation = true,
    disabledIndices,
    modifierKeys = [],
  } = params;

  const [highlightedIndex, setHighlightedIndex] = createSignal(0);
  let current = 0;
  let highlightedElement: HTMLElement | null = null;
  let hasSetDefaultIndex = false;

  function onHighlightedIndexChange(index: number, shouldScrollIntoView = false) {
    const elements = untrack(params.elements);
    highlightedElement = elements[index] ?? null;
    current = index;
    setHighlightedIndex(index);
    if (shouldScrollIntoView) {
      scrollIntoViewIfNeeded(
        untrack(params.rootElement) ?? null,
        elements[index] ?? null,
        untrack(params.direction),
        untrack(params.orientation),
      );
    }
  }

  createEffect(params.map, (map) => {
    if (map.size === 0) {
      return;
    }
    const elements = Array.from(map.keys());

    if (hasSetDefaultIndex) {
      // Items added or removed around the highlighted one shift its index, so follow the element
      // rather than the number.
      const nextIndex = highlightedElement ? elements.indexOf(highlightedElement) : -1;

      if (nextIndex === -1) {
        const replacement = elements[current];
        if (!replacement || isListIndexDisabled(elements, current, disabledIndices)) {
          onHighlightedIndexChange(getFallbackIndex(elements, disabledIndices));
        } else {
          highlightedElement = replacement;
        }
      } else if (nextIndex !== current) {
        onHighlightedIndexChange(nextIndex);
      }
      return;
    }

    hasSetDefaultIndex = true;

    const activeItem = elements.find((element) => element.hasAttribute(ACTIVE_COMPOSITE_ITEM));
    const activeIndex = activeItem ? (map.get(activeItem)?.index ?? -1) : -1;

    if (activeIndex !== -1) {
      onHighlightedIndexChange(activeIndex);
    } else if (isListIndexDisabled(elements, current, disabledIndices)) {
      // A disabled item should not hold the single roving tab stop. If every item is disabled,
      // keep the current index.
      const firstEnabledIndex = findNonDisabledListIndex(elements, { disabledIndices });
      if (!isIndexOutOfListBounds(elements, firstEnabledIndex)) {
        onHighlightedIndexChange(firstEnabledIndex);
      }
    } else {
      highlightedElement = elements[current] ?? null;
    }

    scrollIntoViewIfNeeded(
      untrack(params.rootElement) ?? null,
      activeItem ?? null,
      untrack(params.direction),
      untrack(params.orientation),
    );
  });

  function onKeyDown(event: KeyboardEvent) {
    const isHomeOrEnd = event.key === HOME || event.key === END;
    if (!COMPOSITE_KEYS.has(event.key) || (!enableHomeAndEndKeys && isHomeOrEnd)) {
      return;
    }

    if (isModifierKeySet(event, modifierKeys)) {
      return;
    }

    if (!params.rootElement()) {
      return;
    }

    const orientation = params.orientation();
    const isRtl = params.direction() === "rtl";
    const horizontalForwardKey = isRtl ? ARROW_LEFT : ARROW_RIGHT;
    const horizontalBackwardKey = isRtl ? ARROW_RIGHT : ARROW_LEFT;
    const forwardKey = orientation === "vertical" ? ARROW_DOWN : horizontalForwardKey;
    const backwardKey = orientation === "vertical" ? ARROW_UP : horizontalBackwardKey;

    const target = getTarget(event);
    if (target != null && isNativeInput(target) && !target.matches(":disabled")) {
      const { selectionStart, selectionEnd, value } = target;
      // Leave native text editing alone while selecting, or while the caret can still move.
      if (selectionStart == null || event.shiftKey || selectionStart !== selectionEnd) {
        return;
      }
      if (event.key !== backwardKey && selectionStart < value.length) {
        return;
      }
      if (event.key !== forwardKey && selectionStart > 0) {
        return;
      }
    }

    const elements = params.elements();
    const loopFocus = params.loopFocus();
    let nextIndex = current;
    const minIndex = getMinListIndex(elements, disabledIndices);
    const maxIndex = getMaxListIndex(elements, disabledIndices);

    const isForwardKey =
      (orientation !== "vertical" && event.key === horizontalForwardKey) ||
      (orientation !== "horizontal" && event.key === ARROW_DOWN);
    const isBackwardKey =
      (orientation !== "vertical" && event.key === horizontalBackwardKey) ||
      (orientation !== "horizontal" && event.key === ARROW_UP);

    if (enableHomeAndEndKeys) {
      if (event.key === HOME) {
        nextIndex = minIndex;
      } else if (event.key === END) {
        nextIndex = maxIndex;
      }
    }

    if (nextIndex === current && (isForwardKey || isBackwardKey)) {
      if (loopFocus && nextIndex === maxIndex && isForwardKey) {
        nextIndex = minIndex;
      } else if (loopFocus && nextIndex === minIndex && isBackwardKey) {
        nextIndex = maxIndex;
      } else {
        nextIndex = findNonDisabledListIndex(elements, {
          startingIndex: nextIndex,
          decrement: isBackwardKey,
          disabledIndices,
        });
      }
    }

    if (nextIndex !== current && !isIndexOutOfListBounds(elements, nextIndex)) {
      if (stopEventPropagation) {
        event.stopPropagation();
      }
      if (isHomeOrEnd || isForwardKey || isBackwardKey) {
        event.preventDefault();
      }
      onHighlightedIndexChange(nextIndex, true);
      const next = elements[nextIndex];
      // Wait for a focus manager's `returnFocus` to run first.
      queueMicrotask(() => next?.focus());
    }
  }

  function onFocus(event: FocusEvent) {
    const target = getTarget(event);
    if (target != null && isNativeInput(target)) {
      target.setSelectionRange(0, target.value.length);
    }
  }

  return { highlightedIndex, onHighlightedIndexChange, onKeyDown, onFocus };
}

// The item that should hold the tab stop: the active item when it can take focus, otherwise the
// first item that can. Falls back to 0 so an all-disabled composite keeps the index in range.
function getFallbackIndex(elements: HTMLElement[], disabledIndices?: DisabledIndices) {
  let fallbackIndex = -1;

  for (let index = 0; index < elements.length; index += 1) {
    if (isListIndexDisabled(elements, index, disabledIndices)) {
      continue;
    }
    if (elements[index].hasAttribute(ACTIVE_COMPOSITE_ITEM)) {
      return index;
    }
    if (fallbackIndex === -1) {
      fallbackIndex = index;
    }
  }

  return Math.max(fallbackIndex, 0);
}

function isModifierKeySet(event: KeyboardEvent, ignoredModifierKeys: readonly ModifierKey[]) {
  for (const key of MODIFIER_KEYS) {
    if (!ignoredModifierKeys.includes(key) && event.getModifierState(key)) {
      return true;
    }
  }
  return false;
}
