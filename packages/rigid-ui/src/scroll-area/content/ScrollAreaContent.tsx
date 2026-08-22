import { omit, onSettled, untrack, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useScrollAreaViewportContext } from "../viewport/ScrollAreaViewportContext";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import { overflowStateAttributes } from "../root/stateAttributes";

export interface ScrollAreaContentProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaContent(props: ScrollAreaContentProps) {
  const others = omit(props, "children", "ref", "style");

  const { computeThumbPosition } = useScrollAreaViewportContext();
  const ctx = useScrollAreaRootContext();

  // Content that mounts after the viewport's initial measurement is what brings the overflow state
  // in sync, so its first ResizeObserver delivery must not be skipped. Read once, at creation.
  const computeOnInitialResize = untrack(() => ctx.hasMeasuredScrollbar());

  let contentRef: HTMLDivElement | undefined;

  onSettled(() => {
    if (typeof ResizeObserver === "undefined" || !contentRef) return;

    let hasInitialized = false;
    const ro = new ResizeObserver(() => {
      // A ResizeObserver fires once upon observing. Skip that delivery to avoid
      // double-calculating the thumb position on mount.
      if (!hasInitialized) {
        hasInitialized = true;
        if (!computeOnInitialResize) return;
      }

      computeThumbPosition();
    });

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
      {...overflowStateAttributes(ctx)}
      {...others}
    >
      {props.children}
    </div>
  );
}
