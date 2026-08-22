import { omit, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { useScrollAreaScrollbarContext } from "../scrollbar/ScrollAreaScrollbarContext";
import { ScrollAreaScrollbarCssVars } from "../scrollbar/ScrollAreaScrollbarCssVars";
import { ScrollAreaThumbDataAttributes } from "./ScrollAreaThumbDataAttributes";

export interface ScrollAreaThumbProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  const others = omit(props, "children", "ref", "style");

  const ctx = useScrollAreaRootContext();
  const scrollbarCtx = useScrollAreaScrollbarContext();
  const vertical = () => scrollbarCtx.orientation === "vertical";

  const mergedStyle = () => {
    const base: JSX.CSSProperties = vertical()
      ? { height: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbHeight})` }
      : { width: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbWidth})` };
    // Until the viewport has been measured the thumb size variable is unset, so it would paint at
    // its intrinsic size for a frame.
    if (!ctx.hasMeasuredScrollbar()) {
      base.visibility = "hidden";
    }
    if (typeof props.style === "object" && props.style) {
      return { ...base, ...props.style };
    }
    return base;
  };

  return (
    <div
      ref={(el) => {
        if (vertical()) {
          ctx.thumbYRef = el;
        } else {
          ctx.thumbXRef = el;
        }
        if (typeof props.ref === "function") props.ref(el);
      }}
      {...{
        [ScrollAreaThumbDataAttributes.orientation]: scrollbarCtx.orientation,
        [ScrollAreaThumbDataAttributes.scrolling]: (
          vertical() ? ctx.scrollingY() : ctx.scrollingX()
        )
          ? ""
          : undefined,
      }}
      onPointerDown={(e) => ctx.handlePointerDown(e)}
      onPointerMove={(e) => ctx.handlePointerMove(e)}
      onPointerUp={(e) => ctx.handlePointerUp(e)}
      onPointerCancel={(e) => ctx.handlePointerUp(e)}
      style={mergedStyle()}
      {...others}
    >
      {props.children}
    </div>
  );
}
