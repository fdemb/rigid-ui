import { createEffect, Show, type ParentProps } from "solid-js";
import { renderPart } from "../../internals/renderPart";
import type { JSX } from "@solidjs/web";
import type { PartProps } from "../../utils/domProps";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { ScrollAreaScrollbarContext } from "./ScrollAreaScrollbarContext";
import { contains } from "../../utils/contains";
import { useDirection } from "../../internals/direction-context";
import { getTarget } from "../../utils/getTarget";
import { getOffset } from "../../utils/getOffset";
import { ScrollAreaRootCssVars } from "../root/ScrollAreaRootCssVars";
import { ScrollAreaScrollbarCssVars } from "./ScrollAreaScrollbarCssVars";
import {
  scrollAreaStateAttributesMapping,
  scrollbarState,
  type ScrollAreaScrollbarState,
} from "../root/stateAttributes";

export interface ScrollAreaScrollbarProps extends ParentProps<
  PartProps<HTMLDivElement, JSX.HTMLAttributes<HTMLDivElement>, ScrollAreaScrollbarState>
> {
  /**
   * Whether the scrollbar controls vertical or horizontal scroll.
   * @default 'vertical'
   */
  orientation?: "vertical" | "horizontal";
  /**
   * Whether to keep the HTML element in the DOM when the viewport isn't scrollable.
   * @default false
   */
  keepMounted?: boolean;
}

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  const orientation = () => props.orientation ?? "vertical";
  const vertical = () => orientation() === "vertical";
  const keepMounted = () => props.keepMounted ?? false;

  const ctx = useScrollAreaRootContext();

  // Effective text direction; defaults to "ltr" without a DirectionProvider.
  const direction = useDirection();

  const isHidden = () => (vertical() ? ctx.hiddenState().y : ctx.hiddenState().x);
  const shouldRender = () => keepMounted() || !isHidden();
  // Until the viewport has been measured the thumb size is still 0, so a track rendered now would
  // paint at the wrong size for a frame. `keepMounted` opts out: it asks for the track to be in
  // the DOM regardless of measurement.
  const hideTrackUntilMeasured = () => !ctx.hasMeasuredScrollbar() && !keepMounted();

  // The wheel listener is registered non-passively so it can `preventDefault`, which Solid's
  // delegated `onWheel` cannot do. Re-registers when the track mounts, which for a non-`keepMounted`
  // scrollbar is only once overflow appears.
  createEffect(
    () => [orientation(), shouldRender()] as const,
    ([orient, rendered]) => {
      if (!rendered) return;

      const scrollbarEl = orient === "vertical" ? ctx.scrollbarYRef : ctx.scrollbarXRef;
      if (!scrollbarEl) return;

      function handleWheel(event: WheelEvent) {
        const viewportEl = ctx.viewportRef;
        if (!viewportEl || event.ctrlKey) return;

        const horizontal = orient === "horizontal";
        const scrollProperty = horizontal ? "scrollLeft" : "scrollTop";
        const delta = horizontal ? event.deltaX : event.deltaY;
        if (delta === 0) return;

        const maxScroll = horizontal
          ? viewportEl.scrollWidth - viewportEl.clientWidth
          : viewportEl.scrollHeight - viewportEl.clientHeight;
        // RTL horizontal scrolling uses a negative `scrollLeft` range, from 0 to `-maxScroll`.
        const minScroll = horizontal && direction() === "rtl" ? -maxScroll : 0;
        const maxScrollValue = horizontal && direction() === "rtl" ? 0 : maxScroll;
        const scrollValue = viewportEl[scrollProperty];

        // At an edge (or with no overflow), let the wheel event chain to the parent/page instead
        // of swallowing it via `preventDefault`.
        if (
          (scrollValue <= minScroll && delta < 0) ||
          (scrollValue >= maxScrollValue && delta > 0)
        ) {
          return;
        }

        event.preventDefault();

        viewportEl[scrollProperty] = Math.min(
          maxScrollValue,
          Math.max(minScroll, scrollValue + delta),
        );

        ctx.handleScroll({ x: viewportEl.scrollLeft, y: viewportEl.scrollTop });
      }

      scrollbarEl.addEventListener("wheel", handleWheel, { passive: false });
      return () => scrollbarEl.removeEventListener("wheel", handleWheel);
    },
  );

  function handleScrollbarPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;

    const isVertical = vertical();
    const thumbEl = isVertical ? ctx.thumbYRef : ctx.thumbXRef;

    // Ignore presses that land on the thumb; that gesture is a drag, not a jump-to-click.
    // `getTarget` sees through shadow boundaries, where `event.target` is retargeted to the host.
    if (thumbEl && contains(thumbEl, getTarget(event) as Element | null)) {
      return;
    }

    const viewportEl = ctx.viewportRef;
    if (!viewportEl) return;

    const scrollbarEl = isVertical ? ctx.scrollbarYRef : ctx.scrollbarXRef;
    if (!thumbEl || !scrollbarEl) return;

    const axis = isVertical ? "y" : "x";
    const thumbOffset = getOffset(thumbEl, "margin", axis);
    const scrollbarOffset = getOffset(scrollbarEl, "padding", axis);
    const thumbSizePx = isVertical ? thumbEl.offsetHeight : thumbEl.offsetWidth;
    const trackRect = scrollbarEl.getBoundingClientRect();
    const clickPosition = isVertical
      ? event.clientY - trackRect.top - thumbSizePx / 2 - scrollbarOffset + thumbOffset / 2
      : event.clientX - trackRect.left - thumbSizePx / 2 - scrollbarOffset + thumbOffset / 2;

    const scrollableSize = isVertical ? viewportEl.scrollHeight : viewportEl.scrollWidth;
    const viewportSize = isVertical ? viewportEl.clientHeight : viewportEl.clientWidth;
    const trackSize = isVertical ? scrollbarEl.offsetHeight : scrollbarEl.offsetWidth;

    const maxThumbOffset = trackSize - thumbSizePx - scrollbarOffset - thumbOffset;
    // A short or heavily padded track drives `maxThumbOffset` to zero or negative once the thumb
    // hits its `MIN_THUMB_SIZE` floor. Dividing by it would yield a non-finite or inverted scroll
    // position.
    if (maxThumbOffset <= 0) return;

    const scrollRatio = clickPosition / maxThumbOffset;
    const maxScrollDistance = scrollableSize - viewportSize;

    // Disable snapping before the jump-to-click assignment, or the assigned position quantizes to
    // the nearest snap point and the thumb stays offset from the pointer for the whole drag.
    // `handlePointerDown` below re-runs this as a guarded no-op for the thumb-drag path.
    ctx.disableViewportSnap();

    if (isVertical) {
      viewportEl.scrollTop = scrollRatio * maxScrollDistance;
    } else if (direction() === "rtl") {
      viewportEl.scrollLeft = -(1 - scrollRatio) * maxScrollDistance;
    } else {
      viewportEl.scrollLeft = scrollRatio * maxScrollDistance;
    }

    ctx.handleScroll({ x: viewportEl.scrollLeft, y: viewportEl.scrollTop });

    ctx.handlePointerDown(event);
  }

  return (
    <Show when={shouldRender()}>
      <ScrollAreaScrollbarContext value={{ orientation: orientation() }}>
        {renderPart<HTMLDivElement, ScrollAreaScrollbarState>("div", props, {
          state: () => scrollbarState(ctx, orientation),
          stateAttributesMapping: scrollAreaStateAttributesMapping,
          ref(element) {
            if (vertical()) {
              ctx.scrollbarYRef = element;
            } else {
              ctx.scrollbarXRef = element;
            }
          },
          exclude: ["orientation", "keepMounted"],
          props: [
            {
              "data-id": `${ctx.rootId}-scrollbar`,
              onPointerDown: handleScrollbarPointerDown,
              // Native scrollbars don't move focus when pressed, whichever button is used. Handled
              // here rather than on the thumb so the bubbled press covers both.
              onMouseDown: (event: MouseEvent) => event.preventDefault(),
              onPointerUp: ctx.handlePointerUp,
              // Mirror `onPointerUp` so a browser-cancelled gesture on the track (no thumb child
              // captures the pointer) still clears the drag state.
              onPointerCancel: ctx.handlePointerUp,
              get style() {
                const base: JSX.CSSProperties = {
                  position: "absolute",
                  "touch-action": "none",
                  "-webkit-user-select": "none",
                  "user-select": "none",
                };
                if (hideTrackUntilMeasured()) {
                  base.visibility = "hidden";
                }
                if (vertical()) {
                  Object.assign(base, {
                    top: "0",
                    bottom: `var(${ScrollAreaRootCssVars.scrollAreaCornerHeight})`,
                    "inset-inline-end": "0",
                    [ScrollAreaScrollbarCssVars.scrollAreaThumbHeight]: `${ctx.thumbSize().height}px`,
                  });
                } else {
                  Object.assign(base, {
                    "inset-inline-start": "0",
                    "inset-inline-end": `var(${ScrollAreaRootCssVars.scrollAreaCornerWidth})`,
                    bottom: "0",
                    [ScrollAreaScrollbarCssVars.scrollAreaThumbWidth]: `${ctx.thumbSize().width}px`,
                  });
                }
                return base;
              },
            },
          ],
        })}
      </ScrollAreaScrollbarContext>
    </Show>
  );
}
