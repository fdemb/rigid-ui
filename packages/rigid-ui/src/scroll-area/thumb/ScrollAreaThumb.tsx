import { type ParentProps } from "solid-js";
import { renderPart } from "../../internals/renderPart";
import type { JSX } from "@solidjs/web";
import type { PartProps } from "../../utils/domProps";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { useScrollAreaScrollbarContext } from "../scrollbar/ScrollAreaScrollbarContext";
import { ScrollAreaScrollbarCssVars } from "../scrollbar/ScrollAreaScrollbarCssVars";
import { thumbState, type ScrollAreaThumbState } from "../root/stateAttributes";

export interface ScrollAreaThumbProps extends ParentProps<
  PartProps<HTMLDivElement, JSX.HTMLAttributes<HTMLDivElement>, ScrollAreaThumbState>
> {}

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  const ctx = useScrollAreaRootContext();
  const scrollbarCtx = useScrollAreaScrollbarContext();
  const vertical = () => scrollbarCtx.orientation === "vertical";

  return renderPart<HTMLDivElement, ScrollAreaThumbState>("div", props, {
    state: () => thumbState(ctx, () => scrollbarCtx.orientation),
    ref(element) {
      if (vertical()) {
        ctx.thumbYRef = element;
      } else {
        ctx.thumbXRef = element;
      }
    },
    props: [
      {
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
    ],
  });
}
