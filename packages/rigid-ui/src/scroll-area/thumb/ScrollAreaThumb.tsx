import { type ParentProps } from "solid-js";
import { renderElement } from "../../internals/renderElement";
import type { JSX } from "@solidjs/web";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { useScrollAreaScrollbarContext } from "../scrollbar/ScrollAreaScrollbarContext";
import { ScrollAreaScrollbarCssVars } from "../scrollbar/ScrollAreaScrollbarCssVars";
import { ScrollAreaThumbDataAttributes } from "./ScrollAreaThumbDataAttributes";

export interface ScrollAreaThumbProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  const ctx = useScrollAreaRootContext();
  const scrollbarCtx = useScrollAreaScrollbarContext();
  const vertical = () => scrollbarCtx.orientation === "vertical";

  return (
    <div
      {...{
        [ScrollAreaThumbDataAttributes.orientation]: scrollbarCtx.orientation,
        [ScrollAreaThumbDataAttributes.scrolling]: (
          vertical() ? ctx.scrollingY() : ctx.scrollingX()
        )
          ? ""
          : undefined,
      }}
      {...renderElement<HTMLDivElement>(props, {
        ref(element) {
          if (vertical()) {
            ctx.thumbYRef = element;
          } else {
            ctx.thumbXRef = element;
          }
        },
        props: {
          onPointerDown: ctx.handlePointerDown,
          onPointerMove: ctx.handlePointerMove,
          onPointerUp: ctx.handlePointerUp,
          onPointerCancel: ctx.handlePointerUp,
          get style() {
            const base: JSX.CSSProperties = vertical()
              ? { height: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbHeight})` }
              : { width: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbWidth})` };
            // Until the viewport has been measured the thumb size variable is unset, so it would
            // paint at its intrinsic size for a frame.
            if (!ctx.hasMeasuredScrollbar()) {
              base.visibility = "hidden";
            }
            return base;
          },
        },
      })}
    >
      {props.children}
    </div>
  );
}
