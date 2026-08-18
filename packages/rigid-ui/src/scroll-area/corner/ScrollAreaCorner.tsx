import { omit, Show, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";

export interface ScrollAreaCornerProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  const others = omit(props, "children", "ref", "style");

  const ctx = useScrollAreaRootContext();

  const mergedStyle = () => {
    const base: JSX.CSSProperties = {
      position: "absolute",
      bottom: "0",
      "inset-inline-end": "0",
      width: `${ctx.cornerSize().width}px`,
      height: `${ctx.cornerSize().height}px`,
    };
    if (typeof props.style === "object" && props.style) {
      return { ...base, ...props.style };
    }
    return base;
  };

  return (
    <Show when={!ctx.hiddenState().corner}>
      <div
        ref={(el) => {
          ctx.cornerRef = el;
          if (typeof props.ref === "function") props.ref(el);
        }}
        style={mergedStyle()}
        {...others}
      >
        {props.children}
      </div>
    </Show>
  );
}
