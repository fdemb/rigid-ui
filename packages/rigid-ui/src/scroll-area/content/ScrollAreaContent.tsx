import { onSettled, untrack, type ParentProps } from "solid-js";
import { renderPart } from "../../internals/renderPart";
import type { JSX } from "@solidjs/web";
import type { PartProps } from "../../utils/domProps";
import { useScrollAreaViewportContext } from "../viewport/ScrollAreaViewportContext";
import { useScrollAreaRootContext } from "../root/ScrollAreaRootContext";
import {
  overflowState,
  scrollAreaStateAttributesMapping,
  type ScrollAreaOverflowState,
} from "../root/stateAttributes";

export interface ScrollAreaContentProps extends ParentProps<
  PartProps<HTMLDivElement, JSX.HTMLAttributes<HTMLDivElement>, ScrollAreaOverflowState>
> {}

export function ScrollAreaContent(props: ScrollAreaContentProps) {
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

  return renderPart<HTMLDivElement, ScrollAreaOverflowState>("div", props, {
    state: () => overflowState(ctx),
    stateAttributesMapping: scrollAreaStateAttributesMapping,
    ref(element) {
      contentRef = element;
    },
    props: [
      {
        role: "presentation",
        style: { "min-width": "fit-content" },
      },
    ],
  });
}
