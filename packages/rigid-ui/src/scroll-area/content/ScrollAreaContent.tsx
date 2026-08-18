import { omit, onSettled, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useScrollAreaViewportContext } from "../viewport/ScrollAreaViewportContext";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";

export interface ScrollAreaContentProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaContent(props: ScrollAreaContentProps) {
  const others = omit(props, "children", "ref", "style");

  const { computeThumbPosition } = useScrollAreaViewportContext();
  const ctx = useScrollAreaRootContext();

  let contentRef: HTMLDivElement | undefined;

  onSettled(() => {
    if (typeof ResizeObserver === "undefined" || !contentRef) return;

    const ro = new ResizeObserver(computeThumbPosition);

    ro.observe(contentRef);
    return () => ro.disconnect();
  });

  const mergedStyle = () => {
    const base: JSX.CSSProperties = { "min-width": "fit-content" };
    if (typeof props.style === "object" && props.style) {
      return { ...base, ...props.style };
    }
    return base;
  };

  return (
    <div
      ref={(el) => {
        contentRef = el;
        if (typeof props.ref === "function") props.ref(el);
      }}
      role="presentation"
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
  );
}
