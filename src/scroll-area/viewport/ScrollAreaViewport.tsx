import { createEffect, omit, onSettled, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import { isWebKit } from "../../utils/detectBrowser";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { ScrollAreaViewportContext } from "./ScrollAreaViewportContext";
import { getOffset } from "../../utils/getOffset";
import { MIN_THUMB_SIZE } from "../constants";
import { clamp } from "../../utils/clamp";
import { styleDisableScrollbar } from "../../utils/styles";
import { onVisible } from "../../utils/onVisible";
import { ScrollAreaViewportCssVars } from "./ScrollAreaViewportCssVars";
import { Timeout } from "../../utils/useTimeout";

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
  const others = omit(props, "children", "ref", "class", "style");

  const ctx = useScrollAreaRootContext();

  let programmaticScroll = true;
  const scrollEndTimeout = new Timeout();
  const waitForAnimationsTimeout = new Timeout();

  // Direction hardcoded to 'ltr' for now
  const direction: "ltr" | "rtl" = "ltr";

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
      if (direction === "rtl") {
        scrollLeftFromStart = clamp(-scrollLeft, 0, maxScrollLeft);
      } else {
        scrollLeftFromStart = clamp(scrollLeft, 0, maxScrollLeft);
      }
      scrollLeftFromEnd = maxScrollLeft - scrollLeftFromStart;
    }

    const scrollTopFromStart = !scrollbarYHidden ? clamp(scrollTop, 0, maxScrollTop) : 0;
    const scrollTopFromEnd = !scrollbarYHidden ? maxScrollTop - scrollTopFromStart : 0;
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
      const scrollRangeY = scrollableContentHeight - viewportHeight;
      const scrollRatioY = scrollRangeY === 0 ? 0 : scrollTop / scrollRangeY;
      const thumbOffsetY = Math.min(maxThumbOffsetY, Math.max(0, scrollRatioY * maxThumbOffsetY));
      thumbYEl.style.transform = `translate3d(0,${thumbOffsetY}px,0)`;
    }

    // Handle X (horizontal) scroll
    if (scrollbarXEl && thumbXEl) {
      const maxThumbOffsetX =
        scrollbarXEl.offsetWidth - clampedNextWidth - scrollbarXOffset - thumbXOffset;
      const scrollRangeX = scrollableContentWidth - viewportWidth;
      const scrollRatioX = scrollRangeX === 0 ? 0 : scrollLeft / scrollRangeX;
      const thumbOffsetX =
        direction === "rtl"
          ? clamp(scrollRatioX * maxThumbOffsetX, -maxThumbOffsetX, 0)
          : clamp(scrollRatioX * maxThumbOffsetX, 0, maxThumbOffsetX);
      thumbXEl.style.transform = `translate3d(${thumbOffsetX}px,0,0)`;
    }

    const clampedScrollLeftStart = clamp(scrollLeftFromStart, 0, maxScrollLeft);
    const clampedScrollLeftEnd = clamp(scrollLeftFromEnd, 0, maxScrollLeft);
    const clampedScrollTopStart = clamp(scrollTopFromStart, 0, maxScrollTop);
    const clampedScrollTopEnd = clamp(scrollTopFromEnd, 0, maxScrollTop);

    const overflowMetricsPx: Array<[ScrollAreaViewportCssVars, number]> = [
      [ScrollAreaViewportCssVars.scrollAreaOverflowXStart, clampedScrollLeftStart],
      [ScrollAreaViewportCssVars.scrollAreaOverflowXEnd, clampedScrollLeftEnd],
      [ScrollAreaViewportCssVars.scrollAreaOverflowYStart, clampedScrollTopStart],
      [ScrollAreaViewportCssVars.scrollAreaOverflowYEnd, clampedScrollTopEnd],
    ];

    for (const [cssVar, value] of overflowMetricsPx) {
      viewportEl.style.setProperty(cssVar, `${value}px`);
    }

    if (cornerEl) {
      if (scrollbarXHidden || scrollbarYHidden) {
        ctx.setCornerSize({ width: 0, height: 0 });
      } else if (!scrollbarXHidden && !scrollbarYHidden) {
        ctx.setCornerSize({ width: nextCornerWidth, height: nextCornerHeight });
      }
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

    const nextOverflowEdges = {
      xStart: !scrollbarXHidden && clampedScrollLeftStart > ctx.overflowEdgeThreshold.xStart,
      xEnd: !scrollbarXHidden && clampedScrollLeftEnd > ctx.overflowEdgeThreshold.xEnd,
      yStart: !scrollbarYHidden && clampedScrollTopStart > ctx.overflowEdgeThreshold.yStart,
      yEnd: !scrollbarYHidden && clampedScrollTopEnd > ctx.overflowEdgeThreshold.yEnd,
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
        if (!roInitialized) {
          roInitialized = true;
          return;
        }
        computeThumbPosition();
      });
      ro.observe(viewportEl);

      // Wait for animations to finish
      waitForAnimationsTimeout.start(0, () => {
        const animations = viewportEl.getAnimations({ subtree: true });
        if (animations.length === 0) return;
        Promise.all(animations.map((a) => a.finished))
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

  // Re-compute when hiddenState changes
  createEffect(
    () => ctx.hiddenState(),
    () => {
      queueMicrotask(computeThumbPosition);
    },
  );

  function handleUserInteraction() {
    programmaticScroll = false;
  }

  const hs = () => ctx.hiddenState();

  const mergedStyle = () => {
    const base: JSX.CSSProperties = {
      overflow: "scroll",
      height: "100%",
    };
    if (typeof props.style === "object" && props.style) {
      return { ...base, ...props.style };
    }
    return base;
  };

  return (
    <ScrollAreaViewportContext value={{ computeThumbPosition }}>
      <div
        ref={(el) => {
          ctx.viewportRef = el;
          if (typeof props.ref === "function") props.ref(el);
        }}
        role="presentation"
        tabindex={!hs().x || !hs().y ? 0 : undefined}
        class={[styleDisableScrollbar.className, props.class]}
        onScroll={() => {
          const viewportEl = ctx.viewportRef;
          if (!viewportEl) return;

          computeThumbPosition();

          if (!programmaticScroll) {
            ctx.handleScroll({
              x: viewportEl.scrollLeft,
              y: viewportEl.scrollTop,
            });
          }

          scrollEndTimeout.start(100, () => {
            programmaticScroll = true;
          });
        }}
        onWheel={handleUserInteraction}
        onTouchMove={handleUserInteraction}
        onPointerMove={handleUserInteraction}
        onPointerEnter={handleUserInteraction}
        onKeyDown={handleUserInteraction}
        style={mergedStyle()}
        data-scrolling={ctx.scrollingX() || ctx.scrollingY() ? "" : undefined}
        data-has-overflow-x={!ctx.hiddenState().x ? "" : undefined}
        data-has-overflow-y={!ctx.hiddenState().y ? "" : undefined}
        data-overflow-x-start={ctx.overflowEdges().xStart ? "" : undefined}
        data-overflow-x-end={ctx.overflowEdges().xEnd ? "" : undefined}
        data-overflow-y-start={ctx.overflowEdges().yStart ? "" : undefined}
        data-overflow-y-end={ctx.overflowEdges().yEnd ? "" : undefined}
        {...others}
      >
        {props.children}
      </div>
    </ScrollAreaViewportContext>
  );
}
