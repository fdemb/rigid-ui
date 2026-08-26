import type { StateAttributesMapping } from "../../internals/getStateAttributesProps";
import { ScrollAreaRootDataAttributes as Attr } from "./ScrollAreaRootDataAttributes";
import type { ScrollAreaRootContextValue } from "./ScrollAreaRootContext";

export type ScrollAreaOrientation = "vertical" | "horizontal";

export interface ScrollAreaOverflowState {
  scrolling: boolean;
  hasOverflowX: boolean;
  hasOverflowY: boolean;
  overflowXStart: boolean;
  overflowXEnd: boolean;
  overflowYStart: boolean;
  overflowYEnd: boolean;
}

export interface ScrollAreaScrollbarState extends ScrollAreaOverflowState {
  orientation: ScrollAreaOrientation;
  hovering: boolean;
}

export interface ScrollAreaThumbState {
  orientation: ScrollAreaOrientation;
  scrolling: boolean;
}

function flag(attribute: string) {
  return (value: boolean) => (value ? { [attribute]: "" } : null);
}

/**
 * `scrolling` follows the default `data-<key>` rule. The overflow flags need a mapping because
 * the default rule would lowercase `hasOverflowX` into `data-hasoverflowx`.
 * `enumSync.test.tsx` pins the names against the enums.
 */
export const scrollAreaStateAttributesMapping = {
  hasOverflowX: flag(Attr.hasOverflowX),
  hasOverflowY: flag(Attr.hasOverflowY),
  overflowXStart: flag(Attr.overflowXStart),
  overflowXEnd: flag(Attr.overflowXEnd),
  overflowYStart: flag(Attr.overflowYStart),
  overflowYEnd: flag(Attr.overflowYEnd),
} satisfies StateAttributesMapping<ScrollAreaOverflowState>;

/** The overflow state shared by the root, viewport, and content parts. */
export function overflowState(ctx: ScrollAreaRootContextValue): ScrollAreaOverflowState {
  const hidden = ctx.hiddenState();
  const edges = ctx.overflowEdges();

  return {
    scrolling: ctx.scrollingX() || ctx.scrollingY(),
    hasOverflowX: !hidden.x,
    hasOverflowY: !hidden.y,
    overflowXStart: edges.xStart,
    overflowXEnd: edges.xEnd,
    overflowYStart: edges.yStart,
    overflowYEnd: edges.yEnd,
  };
}

/**
 * The scrollbar reports only the axis it controls. The inactive axis resolves to `false`, so the
 * mapping renders no attribute for it.
 */
export function scrollbarState(
  ctx: ScrollAreaRootContextValue,
  orientation: () => ScrollAreaOrientation,
): ScrollAreaScrollbarState {
  const vertical = orientation() === "vertical";
  const hidden = ctx.hiddenState();
  const edges = ctx.overflowEdges();

  return {
    orientation: orientation(),
    hovering: ctx.hovering(),
    scrolling: vertical ? ctx.scrollingY() : ctx.scrollingX(),
    hasOverflowX: !vertical && !hidden.x,
    hasOverflowY: vertical && !hidden.y,
    overflowXStart: !vertical && edges.xStart,
    overflowXEnd: !vertical && edges.xEnd,
    overflowYStart: vertical && edges.yStart,
    overflowYEnd: vertical && edges.yEnd,
  };
}

export function thumbState(
  ctx: ScrollAreaRootContextValue,
  orientation: () => ScrollAreaOrientation,
): ScrollAreaThumbState {
  const vertical = orientation() === "vertical";

  return {
    orientation: orientation(),
    scrolling: vertical ? ctx.scrollingY() : ctx.scrollingX(),
  };
}
