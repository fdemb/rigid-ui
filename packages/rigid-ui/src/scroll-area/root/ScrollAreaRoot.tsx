import { createSignal, omit, untrack, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  ScrollAreaRootContext,
  type Coords,
  type HiddenState,
  type OverflowEdges,
  type Size,
} from "./ScrollAreaRootContext";
import { ScrollAreaRootCssVars } from "./ScrollAreaRootCssVars";
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
const DEFAULT_HIDDEN_STATE: HiddenState = { x: false, y: false, corner: false };

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

  const overflowEdgeThreshold = untrack(() =>
    normalizeOverflowEdgeThreshold(props.overflowEdgeThreshold),
  );

  const scrollYTimeout = useTimeout();
  const scrollXTimeout = useTimeout();

  const [hovering, setHovering] = createSignal(false);
  const [scrollingX, setScrollingX] = createSignal(false);
  const [scrollingY, setScrollingY] = createSignal(false);
  const [cornerSize, setCornerSize] = createSignal<Size>(DEFAULT_SIZE);
  const [thumbSize, setThumbSize] = createSignal<Size>(DEFAULT_SIZE);
  const [overflowEdges, setOverflowEdges] = createSignal<OverflowEdges>(DEFAULT_OVERFLOW_EDGES);
  const [hiddenState, setHiddenState] = createSignal<HiddenState>(DEFAULT_HIDDEN_STATE);

  let rootRef: HTMLDivElement | undefined;
  let scrollPosition: Coords = { x: 0, y: 0 };

  // Drag state
  let thumbDragging = false;
  let startY = 0;
  let startX = 0;
  let startScrollTop = 0;
  let startScrollLeft = 0;
  let currentOrientation: "vertical" | "horizontal" = "vertical";

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

  function handleScroll(pos: Coords) {
    const offsetX = pos.x - scrollPosition.x;
    const offsetY = pos.y - scrollPosition.y;
    scrollPosition = pos;

    if (offsetY !== 0) {
      setScrollingY(true);
      scrollYTimeout.start(SCROLL_TIMEOUT, () => setScrollingY(false));
    }
    if (offsetX !== 0) {
      setScrollingX(true);
      scrollXTimeout.start(SCROLL_TIMEOUT, () => setScrollingX(false));
    }
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0) return;

    thumbDragging = true;
    startY = event.clientY;
    startX = event.clientX;
    currentOrientation = (event.currentTarget as HTMLElement).getAttribute("data-orientation") as
      | "vertical"
      | "horizontal";

    if (refs.viewportRef) {
      startScrollTop = refs.viewportRef.scrollTop;
      startScrollLeft = refs.viewportRef.scrollLeft;
    }
    if (refs.thumbYRef && currentOrientation === "vertical") {
      refs.thumbYRef.setPointerCapture(event.pointerId);
    }
    if (refs.thumbXRef && currentOrientation === "horizontal") {
      refs.thumbXRef.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (!thumbDragging) return;

    const deltaY = event.clientY - startY;
    const deltaX = event.clientX - startX;
    const vp = refs.viewportRef;
    if (!vp) return;

    const scrollableH = vp.scrollHeight;
    const vpH = vp.clientHeight;
    const scrollableW = vp.scrollWidth;
    const vpW = vp.clientWidth;

    if (refs.thumbYRef && refs.scrollbarYRef && currentOrientation === "vertical") {
      const sbOffset = getOffset(refs.scrollbarYRef, "padding", "y");
      const thOffset = getOffset(refs.thumbYRef, "margin", "y");
      const thH = refs.thumbYRef.offsetHeight;
      const maxOffset = refs.scrollbarYRef.offsetHeight - thH - sbOffset - thOffset;
      vp.scrollTop = startScrollTop + (deltaY / maxOffset) * (scrollableH - vpH);
      event.preventDefault();
      setScrollingY(true);
      scrollYTimeout.start(SCROLL_TIMEOUT, () => setScrollingY(false));
    }

    if (refs.thumbXRef && refs.scrollbarXRef && currentOrientation === "horizontal") {
      const sbOffset = getOffset(refs.scrollbarXRef, "padding", "x");
      const thOffset = getOffset(refs.thumbXRef, "margin", "x");
      const thW = refs.thumbXRef.offsetWidth;
      const maxOffset = refs.scrollbarXRef.offsetWidth - thW - sbOffset - thOffset;
      vp.scrollLeft = startScrollLeft + (deltaX / maxOffset) * (scrollableW - vpW);
      event.preventDefault();
      setScrollingX(true);
      scrollXTimeout.start(SCROLL_TIMEOUT, () => setScrollingX(false));
    }
  }

  function handlePointerUp(event: PointerEvent) {
    thumbDragging = false;
    if (refs.thumbYRef && currentOrientation === "vertical") {
      refs.thumbYRef.releasePointerCapture(event.pointerId);
    }
    if (refs.thumbXRef && currentOrientation === "horizontal") {
      refs.thumbXRef.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerEnterOrMove(event: PointerEvent) {
    if (event.pointerType !== "touch") {
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
        onPointerLeave={() => setHovering(false)}
        style={mergedStyle()}
        data-scrolling={scrollingX() || scrollingY() ? "" : undefined}
        data-has-overflow-x={!hiddenState().x ? "" : undefined}
        data-has-overflow-y={!hiddenState().y ? "" : undefined}
        data-overflow-x-start={overflowEdges().xStart ? "" : undefined}
        data-overflow-x-end={overflowEdges().xEnd ? "" : undefined}
        data-overflow-y-start={overflowEdges().yStart ? "" : undefined}
        data-overflow-y-end={overflowEdges().yEnd ? "" : undefined}
        {...others}
      >
        {props.children}
      </div>
    </ScrollAreaRootContext>
  );
}
