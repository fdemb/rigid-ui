import { omit, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { useScrollAreaScrollbarContext } from "../scrollbar/ScrollAreaScrollbarContext";
import { ScrollAreaScrollbarCssVars } from "../scrollbar/ScrollAreaScrollbarCssVars";

export interface ScrollAreaThumbProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  const others = omit(props, "children", "ref", "style");

  const ctx = useScrollAreaRootContext();
  const scrollbarCtx = useScrollAreaScrollbarContext();

  const mergedStyle = () => {
    const base: JSX.CSSProperties =
      scrollbarCtx.orientation === "vertical"
        ? { height: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbHeight})` }
        : { width: `var(${ScrollAreaScrollbarCssVars.scrollAreaThumbWidth})` };
    if (typeof props.style === "object" && props.style) {
      return { ...base, ...props.style };
    }
    return base;
  };

  return (
    <div
      ref={(el) => {
        if (scrollbarCtx.orientation === "vertical") {
          ctx.thumbYRef = el;
        } else {
          ctx.thumbXRef = el;
        }
        if (typeof props.ref === "function") props.ref(el);
      }}
      data-orientation={scrollbarCtx.orientation}
      onPointerDown={(e) => ctx.handlePointerDown(e)}
      onPointerMove={(e) => ctx.handlePointerMove(e)}
      onPointerUp={(e) => {
        if (scrollbarCtx.orientation === "vertical") {
          ctx.setScrollingY(false);
        }
        if (scrollbarCtx.orientation === "horizontal") {
          ctx.setScrollingX(false);
        }
        ctx.handlePointerUp(e);
      }}
      style={mergedStyle()}
      {...others}
    >
      {props.children}
    </div>
  );
}
