import { createMemo, createSignal, omit, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  ScrollAreaRootContext,
  type Coords,
  type HiddenState,
  type OverflowEdges,
  type Size,
} from "./ScrollAreaRootContext";
import { ScrollAreaRootCssVars } from "./ScrollAreaRootCssVars";
import { overflowStateAttributes } from "./stateAttributes";
import { SCROLL_TIMEOUT } from "../constants";
import { getOffset } from "../../utils/getOffset";
import { styleDisableScrollbar } from "../../utils/styles";
import { contains } from "../../utils/contains";
import { useTimeout } from "../../utils/useTimeout";

const DEFAULT_SIZE: Size = { width: 0, height: 0 };
const DEFAULT_OVERFLOW_EDGES: OverflowEdges = {
  xStart: false,
  xEnd: false,
  yStart: false,
  yEnd: false,
};
// Hidden until the viewport is measured, so scrollbars never paint for content that turns out
// not to overflow.
const DEFAULT_HIDDEN_STATE: HiddenState = { x: true, y: true, corner: true };

export interface ScrollAreaRootProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  overflowEdgeThreshold?:
    | number
    | Partial<{
        xStart: number;
        xEnd: number;
        yStart: number;
        yEnd: number;
      }>;
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

function normalizeOverflowEdgeThreshold(
  threshold: ScrollAreaRootProps["overflowEdgeThreshold"] | undefined,
) {
  if (typeof threshold === "number") {
    const value = Math.max(0, threshold);
    return { xStart: value, xEnd: value, yStart: value, yEnd: value };
  }
  return {
    xStart: Math.max(0, threshold?.xStart || 0),
    xEnd: Math.max(0, threshold?.xEnd || 0),
    yStart: Math.max(0, threshold?.yStart || 0),
    yEnd: Math.max(0, threshold?.yEnd || 0),
  };
}

export function ScrollAreaRoot(props: ScrollAreaRootProps) {
  const others = omit(props, "children", "overflowEdgeThreshold", "ref", "style");

  const overflowEdgeThreshold = createMemo(() =>
    normalizeOverflowEdgeThreshold(props.overflowEdgeThreshold),
  );

  const scrollYTimeout = useTimeout();
  const scrollXTimeout = useTimeout();

  const [hovering, setHovering] = createSignal(false);
  const [scrollingX, setScrollingX] = createSignal(false);
  const [scrollingY, setScrollingY] = createSignal(false);
  const [hasMeasuredScrollbar, setHasMeasuredScrollbar] = createSignal(false);
  const [cornerSize, setCornerSize] = createSignal<Size>(DEFAULT_SIZE);
  const [thumbSize, setThumbSize] = createSignal<Size>(DEFAULT_SIZE);
  const [overflowEdges, setOverflowEdges] = createSignal<OverflowEdges>(DEFAULT_OVERFLOW_EDGES);
  const [hiddenState, setHiddenState] = createSignal<HiddenState>(DEFAULT_HIDDEN_STATE);

  let rootRef: HTMLDivElement | undefined;
  let scrollPosition: Coords = { x: 0, y: 0 };
  // A plain field rather than a signal: nothing renders from it, and the scroll handler that reads
  // it can fire in the same tick as the pointer event that writes it — a signal write would not be
  // visible to that read yet.
  let touchModality = false;

  // Drag state. The active pointer id latches the drag: a second contact must not hijack it, and
  // a release for a stale id must not tear down a live drag.
  let activePointerId: number | null = null;
  let startY = 0;
  let startX = 0;
  let startScrollTop = 0;
  let startScrollLeft = 0;
  let currentOrientation: "vertical" | "horizontal" = "vertical";
  let savedSnapType: string | null = null;

  styleDisableScrollbar.inject();

  // Shared mutable refs object — child components write directly to this
  const refs = {
    viewportRef: undefined as HTMLDivElement | undefined,
    scrollbarYRef: undefined as HTMLDivElement | undefined,
    scrollbarXRef: undefined as HTMLDivElement | undefined,
    thumbYRef: undefined as HTMLDivElement | undefined,
    thumbXRef: undefined as HTMLDivElement | undefined,
    cornerRef: undefined as HTMLDivElement | undefined,
  };

  function activeThumb() {
    return currentOrientation === "vertical" ? refs.thumbYRef : refs.thumbXRef;
  }

  function startScrolling(vertical: boolean) {
    const setScrolling = vertical ? setScrollingY : setScrollingX;
    const timeout = vertical ? scrollYTimeout : scrollXTimeout;

    setScrolling(true);
    timeout.start(SCROLL_TIMEOUT, () => setScrolling(false));
  }

  function handleScroll(pos: Coords) {
    const offsetX = pos.x - scrollPosition.x;
    const offsetY = pos.y - scrollPosition.y;
    scrollPosition = pos;

    if (offsetY !== 0) {
      startScrolling(true);
    }
    if (offsetX !== 0) {
      startScrolling(false);
    }
  }

  // CSS scroll snap forces every programmatic scroll to land on a snap point, making thumb
  // dragging jump between them. Native scrollbars suppress snapping while dragging, so disable it
  // until release; restoring the value re-snaps. The save is guarded so a second pointer during an
  // active drag cannot clobber the saved value with `none`.
  function disableViewportSnap() {
    const viewportEl = refs.viewportRef;
    if (viewportEl && savedSnapType === null) {
      savedSnapType = viewportEl.style.scrollSnapType;
      viewportEl.style.scrollSnapType = "none";
    }
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0) return;

    if (activePointerId !== null) {
      // A live drag holds capture for the active pointer — ignore other pointers. No capture means
      // the release went missing entirely (a silently dropped capture whose id never reappears,
      // e.g. a lost touch contact), so let the new pointer take over rather than leaving the drag
      // latched forever.
      if (activeThumb()?.hasPointerCapture(activePointerId)) {
        return;
      }
    }

    activePointerId = event.pointerId;
    startY = event.clientY;
    startX = event.clientX;
    currentOrientation = (event.currentTarget as HTMLElement).getAttribute("data-orientation") as
      | "vertical"
      | "horizontal";

    const viewportEl = refs.viewportRef;
    if (viewportEl) {
      startScrollTop = viewportEl.scrollTop;
      startScrollLeft = viewportEl.scrollLeft;
      disableViewportSnap();
    }

    activeThumb()?.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return;

    activePointerId = null;
    // Clear the drag's scrolling state immediately rather than waiting for the `SCROLL_TIMEOUT`
    // armed by the last drag move, so every release path — real, `pointercancel`, or the
    // missed-release fallback — behaves the same.
    (currentOrientation === "vertical" ? setScrollingY : setScrollingX)(false);

    if (savedSnapType !== null) {
      if (refs.viewportRef) {
        refs.viewportRef.style.scrollSnapType = savedSnapType;
      }
      savedSnapType = null;
    }

    const thumb = activeThumb();
    // `pointercancel` releases capture implicitly, so guard against releasing one we no longer
    // hold, which would throw.
    if (thumb?.hasPointerCapture(event.pointerId)) {
      thumb.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return;

    // The release can go missing entirely (e.g. the browser drops pointer capture while the
    // scrollbar is hidden mid-drag), leaving the drag latched so a buttonless hover over the thumb
    // scrolls the viewport. Treat a move without the primary button held as that missed release.
    if (event.buttons % 2 === 0) {
      handlePointerUp(event);
      return;
    }

    const viewportEl = refs.viewportRef;
    if (!viewportEl) return;

    const vertical = currentOrientation === "vertical";
    const thumbEl = vertical ? refs.thumbYRef : refs.thumbXRef;
    const scrollbarEl = vertical ? refs.scrollbarYRef : refs.scrollbarXRef;
    if (!thumbEl || !scrollbarEl) return;

    const axis = vertical ? "y" : "x";
    const scrollbarOffset = getOffset(scrollbarEl, "padding", axis);
    const thumbOffset = getOffset(thumbEl, "margin", axis);
    const thumbSizePx = vertical ? thumbEl.offsetHeight : thumbEl.offsetWidth;
    const trackSize = vertical ? scrollbarEl.offsetHeight : scrollbarEl.offsetWidth;
    const maxThumbOffset = trackSize - thumbSizePx - scrollbarOffset - thumbOffset;
    const delta = vertical ? event.clientY - startY : event.clientX - startX;
    // A short or heavily padded track drives `maxThumbOffset` to zero or negative once the thumb
    // hits its `MIN_THUMB_SIZE` floor. Dividing by it would teleport the scroll position to an
    // extreme via a non-finite or inverted ratio.
    const scrollRatio = maxThumbOffset <= 0 ? 0 : delta / maxThumbOffset;

    const scrollableSize = vertical ? viewportEl.scrollHeight : viewportEl.scrollWidth;
    const viewportSize = vertical ? viewportEl.clientHeight : viewportEl.clientWidth;
    const startScroll = vertical ? startScrollTop : startScrollLeft;
    const nextScroll = startScroll + scrollRatio * (scrollableSize - viewportSize);

    if (vertical) {
      viewportEl.scrollTop = nextScroll;
    } else {
      viewportEl.scrollLeft = nextScroll;
    }
    event.preventDefault();

    startScrolling(vertical);
  }

  function handleTouchModalityChange(event: PointerEvent) {
    touchModality = event.pointerType === "touch";
  }

  function handlePointerEnterOrMove(event: PointerEvent) {
    handleTouchModalityChange(event);

    if (event.pointerType !== "touch") {
      // Deliberately `event.target`, not `composedPath()[0]`: inside a shadow tree the retargeted
      // host is still a descendant of the root, and `contains` is shadow-aware either way.
      setHovering(contains(rootRef, event.target as Element));
    }
  }

  const contextValue = {
    cornerSize,
    setCornerSize,
    thumbSize,
    setThumbSize,
    hovering,
    setHovering,
    scrollingX,
    setScrollingX,
    scrollingY,
    setScrollingY,
    hiddenState,
    setHiddenState,
    overflowEdges,
    setOverflowEdges,
    overflowEdgeThreshold,
    hasMeasuredScrollbar,
    setHasMeasuredScrollbar,
    get touchModality() {
      return touchModality;
    },

    // Refs are read/written directly by child components
    get viewportRef() {
      return refs.viewportRef;
    },
    set viewportRef(el) {
      refs.viewportRef = el;
    },
    get scrollbarYRef() {
      return refs.scrollbarYRef;
    },
    set scrollbarYRef(el) {
      refs.scrollbarYRef = el;
    },
    get scrollbarXRef() {
      return refs.scrollbarXRef;
    },
    set scrollbarXRef(el) {
      refs.scrollbarXRef = el;
    },
    get thumbYRef() {
      return refs.thumbYRef;
    },
    set thumbYRef(el) {
      refs.thumbYRef = el;
    },
    get thumbXRef() {
      return refs.thumbXRef;
    },
    set thumbXRef(el) {
      refs.thumbXRef = el;
    },
    get cornerRef() {
      return refs.cornerRef;
    },
    set cornerRef(el) {
      refs.cornerRef = el;
    },

    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScroll,
    disableViewportSnap,
  };

  const mergedStyle = () => {
    const base: JSX.CSSProperties = {
      position: "relative",
      overflow: "hidden",
      [ScrollAreaRootCssVars.scrollAreaCornerHeight]: `${cornerSize().height}px`,
      [ScrollAreaRootCssVars.scrollAreaCornerWidth]: `${cornerSize().width}px`,
    };
    if (typeof props.style === "object" && props.style) {
      return { ...base, ...props.style };
    }
    return base;
  };

  return (
    <ScrollAreaRootContext value={contextValue}>
      <div
        ref={(el) => {
          rootRef = el;
          if (typeof props.ref === "function") props.ref(el);
        }}
        role="presentation"
        onPointerEnter={handlePointerEnterOrMove}
        onPointerMove={handlePointerEnterOrMove}
        onPointerDown={handleTouchModalityChange}
        onPointerLeave={() => setHovering(false)}
        style={mergedStyle()}
        {...overflowStateAttributes(contextValue)}
        {...others}
      >
        {props.children}
      </div>
    </ScrollAreaRootContext>
  );
}
