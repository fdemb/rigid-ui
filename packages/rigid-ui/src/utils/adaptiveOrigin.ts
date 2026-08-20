import { getSide } from "@floating-ui/utils";
import type { Middleware } from "@floating-ui/dom";

export const DEFAULT_SIDES = {
  sideX: "left",
  sideY: "top",
} as const;

export interface AdaptiveOriginData {
  sideX: "left" | "right";
  sideY: "top" | "bottom";
}

/**
 * Reports which edge the positioner's coordinates are relative to, flipping from `left`/`top` to
 * `right`/`bottom` when the popup is anchored on that side. Consumers that transition their size
 * (`width`/`height`) can then anchor to the returned edge so growth moves away from the trigger
 * instead of across it. Only engages while the positioner has a declared CSS transition — without
 * one there is nothing to preserve continuity for, so coordinates pass through unchanged.
 */
export function createAdaptiveOriginMiddleware(): Middleware {
  return {
    name: "adaptiveOrigin",
    async fn(state) {
      const {
        x: rawX,
        y: rawY,
        rects: { floating: floatRect },
        elements: { floating },
        platform,
        strategy,
        placement,
      } = state;

      const win = floating.ownerDocument.defaultView;
      const styles = win?.getComputedStyle(floating);
      const hasTransition = styles
        ? styles.transitionDuration !== "0s" && styles.transitionDuration !== ""
        : false;

      if (!hasTransition) {
        return { x: rawX, y: rawY, data: DEFAULT_SIDES };
      }

      const offsetParent = await platform.getOffsetParent?.(floating);

      let offsetDimensions = { width: 0, height: 0 };

      if (strategy === "fixed" && win?.visualViewport) {
        offsetDimensions = {
          width: win.visualViewport.width,
          height: win.visualViewport.height,
        };
      } else if (offsetParent === win) {
        const doc = floating.ownerDocument;
        offsetDimensions = {
          width: doc.documentElement.clientWidth,
          height: doc.documentElement.clientHeight,
        };
      } else if (await platform.isElement?.(offsetParent)) {
        offsetDimensions = await platform.getDimensions(offsetParent!);
      }

      const currentSide = getSide(placement);
      let x = rawX;
      let y = rawY;

      if (currentSide === "left") {
        x = offsetDimensions.width - (rawX + floatRect.width);
      }
      if (currentSide === "top") {
        y = offsetDimensions.height - (rawY + floatRect.height);
      }

      const sideX = currentSide === "left" ? "right" : DEFAULT_SIDES.sideX;
      const sideY = currentSide === "top" ? "bottom" : DEFAULT_SIDES.sideY;

      return {
        x,
        y,
        data: { sideX, sideY } satisfies AdaptiveOriginData,
      };
    },
  };
}
