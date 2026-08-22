import { createEffect, onSettled, type ParentProps } from "solid-js";
import { renderElement } from "../../internals/renderElement";
import type { JSX } from "@solidjs/web";
import { isWebKit } from "../../utils/detectBrowser";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { ScrollAreaViewportContext } from "./ScrollAreaViewportContext";
import { getOffset } from "../../utils/getOffset";
import { MIN_THUMB_SIZE } from "../constants";
import { useDirection } from "../../internals/direction-context";
import { clamp } from "../../utils/clamp";
import { normalizeScrollOffset } from "../../utils/scrollEdges";
import { styleDisableScrollbar } from "../../utils/styles";
import { onVisible } from "../../utils/onVisible";
import { ScrollAreaViewportCssVars } from "./ScrollAreaViewportCssVars";
import { ScrollAreaScrollbarCssVars } from "../scrollbar/ScrollAreaScrollbarCssVars";
import { overflowStateAttributes } from "../root/stateAttributes";
import { Timeout } from "../../utils/useTimeout";

/**
 * Sizes the thumb and returns its axis offset. On overscroll (Safari rubber-band only) it shrinks
 * against the pinned edge, damped by `content / (content + overscroll)` to match native feedback;
 * the size flows through the thumb-size variable so the resting `var(...)` still applies.
 */
function applyOverscrollThumb(
  thumbEl: HTMLElement,
  sizeVar: ScrollAreaScrollbarCssVars,
  scrollFromStart: number,
  maxScroll: number,
  content: number,
  size: number,
  maxThumbOffset: number,
): number {
  const clamped = clamp(scrollFromStart, 0, maxScroll);
  const overscroll = scrollFromStart - clamped;
  const nextSize = Math.max(MIN_THUMB_SIZE, (size * content) / (content + Math.abs(overscroll)));

  // An empty string removes the override, restoring the resting `var(...)` size.
  thumbEl.style.setProperty(sizeVar, overscroll ? `${nextSize}px` : "");

  // Slide proportionally; at the end edge push down by the shrink so the thumb stays pinned to it,
  // while a start overscroll pins to offset 0.
  const offset = maxScroll ? (clamped / maxScroll) * maxThumbOffset : 0;
  return offset + (overscroll > 0 ? size - nextSize : 0);
}

let scrollAreaOverflowVarsRegistered = false;

function removeCSSVariableInheritance() {
  if (scrollAreaOverflowVarsRegistered || isWebKit) {
    return;
  }

  if (typeof CSS !== "undefined" && "registerProperty" in CSS) {
    [
      ScrollAreaViewportCssVars.scrollAreaOverflowXStart,
      ScrollAreaViewportCssVars.scrollAreaOverflowXEnd,
      ScrollAreaViewportCssVars.scrollAreaOverflowYStart,
      ScrollAreaViewportCssVars.scrollAreaOverflowYEnd,
    ].forEach((name) => {
      try {
        CSS.registerProperty({
          name,
          syntax: "<length>",
          inherits: false,
          initialValue: "0px",
        });
      } catch {
        /* ignore already-registered */
      }
    });
  }

  scrollAreaOverflowVarsRegistered = true;
}

export interface ScrollAreaViewportProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  const ctx = useScrollAreaRootContext();

  let programmaticScroll = true;
  const scrollEndTimeout = new Timeout();
  const waitForAnimationsTimeout = new Timeout();

  // The viewport dimensions as of the last measurement, used to tell a redundant first
  // ResizeObserver delivery from one that carries a real change.
  let lastMeasured: [number, number, number, number] = [NaN, NaN, NaN, NaN];

  // Effective text direction; defaults to "ltr" without a DirectionProvider.
  const direction = useDirection();

  function computeThumbPosition() {
    const viewportEl = ctx.viewportRef;
    const scrollbarYEl = ctx.scrollbarYRef;
    const scrollbarXEl = ctx.scrollbarXRef;
    const thumbYEl = ctx.thumbYRef;
    const thumbXEl = ctx.thumbXRef;
    const cornerEl = ctx.cornerRef;

    if (!viewportEl) return;

    const scrollableContentHeight = viewportEl.scrollHeight;
    const scrollableContentWidth = viewportEl.scrollWidth;
    const viewportHeight = viewportEl.clientHeight;
    const viewportWidth = viewportEl.clientWidth;
    const scrollTop = viewportEl.scrollTop;
    const scrollLeft = viewportEl.scrollLeft;

    const isFirstMeasurement = Number.isNaN(lastMeasured[0]);
    lastMeasured = [viewportHeight, scrollableContentHeight, viewportWidth, scrollableContentWidth];

    if (isFirstMeasurement) {
      ctx.setHasMeasuredScrollbar(true);
    }

    if (scrollableContentHeight === 0 || scrollableContentWidth === 0) return;

    const scrollbarYHidden = viewportHeight >= scrollableContentHeight;
    const scrollbarXHidden = viewportWidth >= scrollableContentWidth;
    const ratioX = viewportWidth / scrollableContentWidth;
    const ratioY = viewportHeight / scrollableContentHeight;
    const maxScrollLeft = Math.max(0, scrollableContentWidth - viewportWidth);
    const maxScrollTop = Math.max(0, scrollableContentHeight - viewportHeight);

    let scrollLeftFromStart = 0;
    let scrollLeftFromEnd = 0;
    if (!scrollbarXHidden) {
      // `normalizeScrollOffset` clamps internally.
      scrollLeftFromStart = normalizeScrollOffset(
        direction() === "rtl" ? -scrollLeft : scrollLeft,
        maxScrollLeft,
      );
      scrollLeftFromEnd = maxScrollLeft - scrollLeftFromStart;
    }

    const scrollTopFromStart = scrollbarYHidden
      ? 0
      : normalizeScrollOffset(scrollTop, maxScrollTop);
    const scrollTopFromEnd = scrollbarYHidden ? 0 : maxScrollTop - scrollTopFromStart;
    const nextWidth = scrollbarXHidden ? 0 : viewportWidth;
    const nextHeight = scrollbarYHidden ? 0 : viewportHeight;

    let nextCornerWidth = 0;
    let nextCornerHeight = 0;
    if (!scrollbarXHidden && !scrollbarYHidden) {
      nextCornerWidth = scrollbarYEl?.offsetWidth || 0;
      nextCornerHeight = scrollbarXEl?.offsetHeight || 0;
    }

    const cs = ctx.cornerSize();
    const cornerNotYetSized = cs.width === 0 && cs.height === 0;
    const cornerWidthOffset = cornerNotYetSized ? nextCornerWidth : 0;
    const cornerHeightOffset = cornerNotYetSized ? nextCornerHeight : 0;

    const scrollbarXOffset = getOffset(scrollbarXEl ?? null, "padding", "x");
    const scrollbarYOffset = getOffset(scrollbarYEl ?? null, "padding", "y");
    const thumbXOffset = getOffset(thumbXEl ?? null, "margin", "x");
    const thumbYOffset = getOffset(thumbYEl ?? null, "margin", "y");

    const idealNextWidth = nextWidth - scrollbarXOffset - thumbXOffset;
    const idealNextHeight = nextHeight - scrollbarYOffset - thumbYOffset;

    const maxNextWidth = scrollbarXEl
      ? Math.min(scrollbarXEl.offsetWidth - cornerWidthOffset, idealNextWidth)
      : idealNextWidth;
    const maxNextHeight = scrollbarYEl
      ? Math.min(scrollbarYEl.offsetHeight - cornerHeightOffset, idealNextHeight)
      : idealNextHeight;

    const clampedNextWidth = Math.max(MIN_THUMB_SIZE, maxNextWidth * ratioX);
    const clampedNextHeight = Math.max(MIN_THUMB_SIZE, maxNextHeight * ratioY);

    ctx.setThumbSize((prevSize) => {
      if (prevSize.height === clampedNextHeight && prevSize.width === clampedNextWidth) {
        return prevSize;
      }
      return { width: clampedNextWidth, height: clampedNextHeight };
    });

    // Handle Y (vertical) scroll
    if (scrollbarYEl && thumbYEl) {
      const maxThumbOffsetY =
        scrollbarYEl.offsetHeight - clampedNextHeight - scrollbarYOffset - thumbYOffset;

      const thumbOffsetY = applyOverscrollThumb(
        thumbYEl,
        ScrollAreaScrollbarCssVars.scrollAreaThumbHeight,
        scrollTop,
        maxScrollTop,
        scrollableContentHeight,
        clampedNextHeight,
        maxThumbOffsetY,
      );
      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`;
    }

    // Handle X (horizontal) scroll
    if (scrollbarXEl && thumbXEl) {
      const maxThumbOffsetX =
        scrollbarXEl.offsetWidth - clampedNextWidth - scrollbarXOffset - thumbXOffset;
      // RTL scrolls from 0 down to `-maxScrollLeft`; measure from the inline start edge so the
      // overscroll math is direction-agnostic, then flip the resulting offset back below.
      const scrollFromStart = direction() === "rtl" ? -scrollLeft : scrollLeft;

      const offsetX = applyOverscrollThumb(
        thumbXEl,
        ScrollAreaScrollbarCssVars.scrollAreaThumbWidth,
        scrollFromStart,
        maxScrollLeft,
        scrollableContentWidth,
        clampedNextWidth,
        maxThumbOffsetX,
      );
      thumbXEl.style.transform = `translate3d(${direction() === "rtl" ? -offsetX : offsetX}px,0,0)`;
    }

    const overflowMetricsPx: Array<[ScrollAreaViewportCssVars, number]> = [
      [ScrollAreaViewportCssVars.scrollAreaOverflowXStart, scrollLeftFromStart],
      [ScrollAreaViewportCssVars.scrollAreaOverflowXEnd, scrollLeftFromEnd],
      [ScrollAreaViewportCssVars.scrollAreaOverflowYStart, scrollTopFromStart],
      [ScrollAreaViewportCssVars.scrollAreaOverflowYEnd, scrollTopFromEnd],
    ];

    for (const [cssVar, value] of overflowMetricsPx) {
      viewportEl.style.setProperty(cssVar, `${value}px`);
    }

    if (cornerEl) {
      ctx.setCornerSize((prev) => {
        if (prev.width === nextCornerWidth && prev.height === nextCornerHeight) {
          return prev;
        }
        return { width: nextCornerWidth, height: nextCornerHeight };
      });
    }

    ctx.setHiddenState((prevState) => {
      const cornerHidden = scrollbarYHidden || scrollbarXHidden;
      if (
        prevState.y === scrollbarYHidden &&
        prevState.x === scrollbarXHidden &&
        prevState.corner === cornerHidden
      ) {
        return prevState;
      }
      return { y: scrollbarYHidden, x: scrollbarXHidden, corner: cornerHidden };
    });

    const threshold = ctx.overflowEdgeThreshold();
    const nextOverflowEdges = {
      xStart: !scrollbarXHidden && scrollLeftFromStart > threshold.xStart,
      xEnd: !scrollbarXHidden && scrollLeftFromEnd > threshold.xEnd,
      yStart: !scrollbarYHidden && scrollTopFromStart > threshold.yStart,
      yEnd: !scrollbarYHidden && scrollTopFromEnd > threshold.yEnd,
    };

    ctx.setOverflowEdges((prev) => {
      if (
        prev.xStart === nextOverflowEdges.xStart &&
        prev.xEnd === nextOverflowEdges.xEnd &&
        prev.yStart === nextOverflowEdges.yStart &&
        prev.yEnd === nextOverflowEdges.yEnd
      ) {
        return prev;
      }
      return nextOverflowEdges;
    });
  }

  // Overflow-edge math branches on direction (RTL scrollLeft runs negative), so a provider
  // flip must trigger a fresh measurement pass.
  createEffect(
    () => direction(),
    (_current, previous) => {
      if (previous === undefined) return;
      queueMicrotask(computeThumbPosition);
    },
  );

  onSettled(() => {
    const viewportEl = ctx.viewportRef;
    if (!viewportEl) {
      return () => {
        scrollEndTimeout.clear();
        waitForAnimationsTimeout.clear();
      };
    }

    removeCSSVariableInheritance();

    // Check if viewport is already hovered
    if (viewportEl.matches(":hover")) {
      ctx.setHovering(true);
    }

    // Wait for scrollbar refs to be set, then compute
    queueMicrotask(computeThumbPosition);

    // Watch for visibility changes
    let hasInitialized = false;
    const cleanupVisible = onVisible(viewportEl, () => {
      if (!hasInitialized) {
        hasInitialized = true;
        return;
      }
      computeThumbPosition();
    });

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      let roInitialized = false;
      ro = new ResizeObserver(() => {
        // A ResizeObserver fires once on observe. Skip that delivery only when it reports the
        // same dimensions the mount pass already measured — otherwise it is what brings the
        // overflow state in sync for content that mounted after that pass.
        if (!roInitialized) {
          roInitialized = true;
          if (
            lastMeasured[0] === viewportEl.clientHeight &&
            lastMeasured[1] === viewportEl.scrollHeight &&
            lastMeasured[2] === viewportEl.clientWidth &&
            lastMeasured[3] === viewportEl.scrollWidth
          ) {
            return;
          }
        }
        computeThumbPosition();
      });
      ro.observe(viewportEl);

      // Wait for animations to finish
      waitForAnimationsTimeout.start(0, () => {
        const animations = viewportEl.getAnimations({ subtree: true });
        if (animations.length === 0) return;
        // `allSettled` so a cancelled animation still triggers the recompute.
        Promise.allSettled(animations.map((a) => a.finished))
          .then(computeThumbPosition)
          .catch(() => {});
      });
    }

    return () => {
      cleanupVisible();
      ro?.disconnect();
      scrollEndTimeout.clear();
      waitForAnimationsTimeout.clear();
    };
  });

  // Re-compute when the hidden state toggles (scrollbar and thumb refs appear or disappear) and
  // when the overflow edge thresholds change.
  createEffect(
    () => [ctx.hiddenState(), ctx.overflowEdgeThreshold()] as const,
    () => {
      queueMicrotask(computeThumbPosition);
    },
  );

  function handleUserInteraction() {
    programmaticScroll = false;
  }

  const hs = () => ctx.hiddenState();

  return (
    <ScrollAreaViewportContext value={{ computeThumbPosition }}>
      <div
        {...overflowStateAttributes(ctx)}
        {...renderElement<HTMLDivElement>(props, {
          ref(element) {
            ctx.viewportRef = element;
          },
          props: {
            role: "presentation",
            "data-id": `${ctx.rootId}-viewport`,
            // https://accessibilityinsights.io/info-examples/web/scrollable-region-focusable/
            // Keep non-scrollable viewports out of tab order.
            get tabindex() {
              return hs().x && hs().y ? -1 : 0;
            },
            class: styleDisableScrollbar.className,
            onScroll() {
              const viewportEl = ctx.viewportRef;
              if (!viewportEl) return;

              computeThumbPosition();

              // WebKit consumes a touch that catches an in-flight momentum scroll or rubber-band
              // bounce without dispatching any DOM events for the whole gesture (not even
              // `touchstart`), so scrolls cannot be attributed to the user through events. Treat every
              // scroll in touch modality as user-driven instead.
              if (ctx.touchModality || !programmaticScroll) {
                ctx.handleScroll({
                  x: viewportEl.scrollLeft,
                  y: viewportEl.scrollTop,
                });
              }

              // Debounce the restoration of the programmatic flag so it only flips back once scrolling
              // has come to rest, keeping momentum scrolling (which fires no further interaction
              // events) user-driven. 100ms without scroll events ≈ scroll end.
              scrollEndTimeout.start(100, () => {
                programmaticScroll = true;
              });
            },
            onWheel: handleUserInteraction,
            onTouchMove: handleUserInteraction,
            onPointerMove: handleUserInteraction,
            onPointerEnter: handleUserInteraction,
            onKeyDown: handleUserInteraction,
            style: {
              overflow: "scroll",
              height: "100%",
            },
          },
        })}
      >
        {props.children}
      </div>
    </ScrollAreaViewportContext>
  );
}
