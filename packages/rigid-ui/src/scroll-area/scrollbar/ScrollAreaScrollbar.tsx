import { createEffect, omit, Show, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { ScrollAreaScrollbarContext } from "./ScrollAreaScrollbarContext";
import { getOffset } from "../../utils/getOffset";
import { ScrollAreaRootCssVars } from "../root/ScrollAreaRootCssVars";
import { ScrollAreaScrollbarCssVars } from "./ScrollAreaScrollbarCssVars";

export interface ScrollAreaScrollbarProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  orientation?: "vertical" | "horizontal";
  keepMounted?: boolean;
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  const others = omit(props, "children", "orientation", "keepMounted", "ref", "style");

  const orientation = () => props.orientation ?? "vertical";
  const keepMounted = () => props.keepMounted ?? false;

  const ctx = useScrollAreaRootContext();

  // Direction hardcoded to 'ltr' for now
  const direction: "ltr" | "rtl" = "ltr";

  // Wheel handler on scrollbar
  createEffect(
    () => orientation(),
    (orient) => {
      const scrollbarEl = orient === "vertical" ? ctx.scrollbarYRef : ctx.scrollbarXRef;
      const viewportEl = ctx.viewportRef;

      if (!scrollbarEl) return;

      function handleWheel(event: WheelEvent) {
        if (!viewportEl || !scrollbarEl || event.ctrlKey) return;

        event.preventDefault();

        if (orient === "vertical") {
          if (viewportEl.scrollTop === 0 && event.deltaY < 0) return;
          if (
            viewportEl.scrollTop === viewportEl.scrollHeight - viewportEl.clientHeight &&
            event.deltaY > 0
          )
            return;
          viewportEl.scrollTop += event.deltaY;
        } else {
          if (viewportEl.scrollLeft === 0 && event.deltaX < 0) return;
          if (
            viewportEl.scrollLeft === viewportEl.scrollWidth - viewportEl.clientWidth &&
            event.deltaX > 0
          )
            return;
          viewportEl.scrollLeft += event.deltaX;
        }
      }

      scrollbarEl.addEventListener("wheel", handleWheel, { passive: false });
      return () => scrollbarEl.removeEventListener("wheel", handleWheel);
    },
  );

  function handleScrollbarPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    if (event.currentTarget !== event.target) return;

    const viewportEl = ctx.viewportRef;
    if (!viewportEl) return;

    const orient = orientation();

    if (ctx.thumbYRef && ctx.scrollbarYRef && orient === "vertical") {
      const thumbYOffset = getOffset(ctx.thumbYRef, "margin", "y");
      const scrollbarYOffset = getOffset(ctx.scrollbarYRef, "padding", "y");
      const thumbHeight = ctx.thumbYRef.offsetHeight;
      const trackRectY = ctx.scrollbarYRef.getBoundingClientRect();
      const clickY =
        event.clientY - trackRectY.top - thumbHeight / 2 - scrollbarYOffset + thumbYOffset / 2;

      const scrollableContentHeight = viewportEl.scrollHeight;
      const viewportHeight = viewportEl.clientHeight;
      const maxThumbOffsetY =
        ctx.scrollbarYRef.offsetHeight - thumbHeight - scrollbarYOffset - thumbYOffset;
      const scrollRatioY = clickY / maxThumbOffsetY;
      viewportEl.scrollTop = scrollRatioY * (scrollableContentHeight - viewportHeight);
    }

    if (ctx.thumbXRef && ctx.scrollbarXRef && orient === "horizontal") {
      const thumbXOffset = getOffset(ctx.thumbXRef, "margin", "x");
      const scrollbarXOffset = getOffset(ctx.scrollbarXRef, "padding", "x");
      const thumbWidth = ctx.thumbXRef.offsetWidth;
      const trackRectX = ctx.scrollbarXRef.getBoundingClientRect();
      const clickX =
        event.clientX - trackRectX.left - thumbWidth / 2 - scrollbarXOffset + thumbXOffset / 2;

      const scrollableContentWidth = viewportEl.scrollWidth;
      const viewportWidth = viewportEl.clientWidth;
      const maxThumbOffsetX =
        ctx.scrollbarXRef.offsetWidth - thumbWidth - scrollbarXOffset - thumbXOffset;
      const scrollRatioX = clickX / maxThumbOffsetX;

      let newScrollLeft: number;
      if (direction === "rtl") {
        newScrollLeft = (1 - scrollRatioX) * (scrollableContentWidth - viewportWidth);
        if (viewportEl.scrollLeft <= 0) {
          newScrollLeft = -newScrollLeft;
        }
      } else {
        newScrollLeft = scrollRatioX * (scrollableContentWidth - viewportWidth);
      }

      viewportEl.scrollLeft = newScrollLeft;
    }

    ctx.handlePointerDown(event);
  }

  const isHidden = () => (orientation() === "vertical" ? ctx.hiddenState().y : ctx.hiddenState().x);
  const shouldRender = () => keepMounted() || !isHidden();

  const mergedStyle = () => {
    const base: JSX.CSSProperties = {
      position: "absolute",
      "touch-action": "none",
      "-webkit-user-select": "none",
      "user-select": "none",
    };
    if (orientation() === "vertical") {
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
    if (typeof props.style === "object" && props.style) {
      return { ...base, ...props.style };
    }
    return base;
  };

  return (
    <Show when={shouldRender()}>
      <ScrollAreaScrollbarContext value={{ orientation: orientation() }}>
        <div
          ref={(el) => {
            if (orientation() === "vertical") {
              ctx.scrollbarYRef = el;
            } else {
              ctx.scrollbarXRef = el;
            }
            if (typeof props.ref === "function") props.ref(el);
          }}
          data-orientation={orientation()}
          data-hovering={ctx.hovering() ? "" : undefined}
          data-scrolling={
            (orientation() === "vertical" ? ctx.scrollingY() : ctx.scrollingX()) ? "" : undefined
          }
          onPointerDown={handleScrollbarPointerDown}
          onPointerUp={(e) => ctx.handlePointerUp(e)}
          style={mergedStyle()}
          {...others}
        >
          {props.children}
        </div>
      </ScrollAreaScrollbarContext>
    </Show>
  );
}
