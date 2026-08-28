import { Show, type ParentProps } from "solid-js";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";

export interface ScrollAreaCornerProps extends ParentProps<PartProps<HTMLDivElement>> {}

export function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  const ctx = useScrollAreaRootContext();

  return (
    <Show when={!ctx.hiddenState().corner}>
      {renderPart<HTMLDivElement>("div", props, {
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
    </Show>
  );
}
