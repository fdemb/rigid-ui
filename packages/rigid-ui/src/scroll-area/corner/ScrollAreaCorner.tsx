import { Show, type ParentProps } from "solid-js";
import { renderElement } from "../../internals/renderElement";
import type { JSX } from "@solidjs/web";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";

export interface ScrollAreaCornerProps extends ParentProps<JSX.HTMLAttributes<HTMLDivElement>> {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}

export function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  const ctx = useScrollAreaRootContext();

  return (
    <Show when={!ctx.hiddenState().corner}>
      <div
        {...renderElement<HTMLDivElement>(props, {
          ref(element) {
            ctx.cornerRef = element;
          },
          props: {
            get style() {
              return {
                position: "absolute",
                bottom: "0",
                "inset-inline-end": "0",
                width: `${ctx.cornerSize().width}px`,
                height: `${ctx.cornerSize().height}px`,
              };
            },
          },
        })}
      >
        {props.children}
      </div>
    </Show>
  );
}
