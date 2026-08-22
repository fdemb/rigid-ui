import { ScrollAreaRootDataAttributes as Attr } from "./ScrollAreaRootDataAttributes";
import type { ScrollAreaRootContextValue } from "./ScrollAreaRootContext";

/**
 * The overflow state attributes shared by the root, viewport, content, and scrollbar parts.
 * Reading through the enum is what keeps the documented names and the rendered ones in sync;
 * `enumSync.test.tsx` pins the other direction.
 */
export function overflowStateAttributes(ctx: ScrollAreaRootContextValue) {
  const hidden = ctx.hiddenState();
  const edges = ctx.overflowEdges();

  return {
    [Attr.scrolling]: ctx.scrollingX() || ctx.scrollingY() ? "" : undefined,
    [Attr.hasOverflowX]: !hidden.x ? "" : undefined,
    [Attr.hasOverflowY]: !hidden.y ? "" : undefined,
    [Attr.overflowXStart]: edges.xStart ? "" : undefined,
    [Attr.overflowXEnd]: edges.xEnd ? "" : undefined,
    [Attr.overflowYStart]: edges.yStart ? "" : undefined,
    [Attr.overflowYEnd]: edges.yEnd ? "" : undefined,
  };
}

/**
 * The scrollbar only exposes the axis it controls, matching Base UI: a vertical track carries no
 * horizontal overflow attributes.
 */
export function scrollbarOverflowStateAttributes(
  ctx: ScrollAreaRootContextValue,
  orientation: "vertical" | "horizontal",
) {
  const hidden = ctx.hiddenState();
  const edges = ctx.overflowEdges();

  if (orientation === "vertical") {
    return {
      [Attr.hasOverflowY]: !hidden.y ? "" : undefined,
      [Attr.overflowYStart]: edges.yStart ? "" : undefined,
      [Attr.overflowYEnd]: edges.yEnd ? "" : undefined,
    };
  }

  return {
    [Attr.hasOverflowX]: !hidden.x ? "" : undefined,
    [Attr.overflowXStart]: edges.xStart ? "" : undefined,
    [Attr.overflowXEnd]: edges.xEnd ? "" : undefined,
  };
}
