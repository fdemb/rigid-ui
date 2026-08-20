import { createEffect, onCleanup, type Accessor } from "solid-js";
import type { Dimensions } from "@floating-ui/utils";
import type { PhysicalSide } from "./createAnchorPositioning";
import { getCssDimensions } from "./getCssDimensions";
import { runOnceAnimationsFinish } from "./runOnceAnimationsFinish";

export interface CreatePopupAutoResizeParams {
  popupElement: Accessor<HTMLElement | undefined>;
  positionerElement: Accessor<HTMLElement | undefined>;
  mounted: Accessor<boolean>;
  /** Value that triggers a resize when it changes. Doesn't have to be the rendered content. */
  content: Accessor<unknown>;
  /** Physical side the popup is rendered on, used to decide which edge to anchor while resizing. */
  side: Accessor<PhysicalSide>;
  /** Called right before the new content's natural size is measured. */
  onMeasureLayout?: () => void;
  /** Called once the new size has been measured; `previous` is `null` on the first measurement. */
  onMeasureLayoutComplete?: (previous: Dimensions | null, next: Dimensions) => void;
}

const NOOP = () => {};

function overrideElementStyle(element: HTMLElement, property: string, value: string) {
  const original = element.style.getPropertyValue(property);
  element.style.setProperty(property, value);
  return () => element.style.setProperty(property, original);
}

function applyElementStyles(element: HTMLElement, styles: Record<string, string>) {
  const restorers = Object.entries(styles).map(([property, value]) =>
    overrideElementStyle(element, property, value),
  );
  return restorers.length ? () => restorers.forEach((restore) => restore()) : NOOP;
}

function setPopupCssSize(popup: HTMLElement, size: Dimensions | "auto") {
  popup.style.setProperty("--popup-width", size === "auto" ? "auto" : `${size.width}px`);
  popup.style.setProperty("--popup-height", size === "auto" ? "auto" : `${size.height}px`);
}

function setPositionerCssSize(positioner: HTMLElement, size: Dimensions | "max-content") {
  positioner.style.setProperty(
    "--positioner-width",
    size === "max-content" ? "max-content" : `${size.width}px`,
  );
  positioner.style.setProperty(
    "--positioner-height",
    size === "max-content" ? "max-content" : `${size.height}px`,
  );
}

/**
 * Ensures a popup anchored to `top`/`left` keeps that edge fixed while its own width/height
 * transitions (via the `--popup-width`/`--popup-height` vars below), so growth moves away from
 * the trigger instead of across it. Paired with the positioner's `adaptiveOrigin` middleware,
 * which does the same for the positioner's own coordinates.
 */
function getPopupAnchoringStyles(side: PhysicalSide): Record<string, string> {
  const isTop = side === "top";
  const isLeft = side === "left";
  if (!isTop && !isLeft) return {};
  return {
    position: "absolute",
    [isTop ? "bottom" : "top"]: "0px",
    [isLeft ? "right" : "left"]: "0px",
  };
}

/**
 * Gives a popup a smooth CSS transition between sizes as its content changes, instead of
 * snapping. Measures the new content's natural size with the popup temporarily taken out of
 * position/absolute sizing (`position: static`, `transform: none`, `scale: 1`), commits that as
 * the new `--popup-width`/`--popup-height` target on the next frame, and lets a CSS transition on
 * those vars animate between the previous and new size before resetting them to `auto`.
 */
export function createPopupAutoResize(params: CreatePopupAutoResizeParams) {
  let committedDimensions: Dimensions | null = null;
  let isInitialRender = true;
  let restoreAnchoringStyles = NOOP;
  let frame: number | undefined;
  let cancelRevertWatcher: (() => void) | undefined;

  function cancelPendingFrame() {
    if (frame !== undefined && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(frame);
    }
    frame = undefined;
  }

  createEffect(
    () =>
      [
        params.mounted(),
        params.popupElement(),
        params.positionerElement(),
        params.content(),
        params.side(),
      ] as const,
    ([mounted, popupElement, positionerElement, , side]) => {
      if (!mounted) {
        restoreAnchoringStyles = NOOP;
        isInitialRender = true;
        committedDimensions = null;
        return;
      }
      if (!popupElement || !positionerElement) return;

      restoreAnchoringStyles = applyElementStyles(popupElement, getPopupAnchoringStyles(side));

      // Measure the rendered size to enable transitions:
      setPopupCssSize(popupElement, "auto");

      const restorePosition = overrideElementStyle(popupElement, "position", "static");
      const restoreTransform = overrideElementStyle(popupElement, "transform", "none");
      const restoreScale = overrideElementStyle(popupElement, "scale", "1");
      const restoreAvailableSize = applyElementStyles(positionerElement, {
        "--available-width": "max-content",
        "--available-height": "max-content",
      });

      function restoreMeasurementOverrides() {
        restorePosition();
        restoreTransform();
        restoreAvailableSize();
      }
      function restoreMeasurementOverridesIncludingScale() {
        restoreMeasurementOverrides();
        restoreScale();
      }

      params.onMeasureLayout?.();

      if (isInitialRender || committedDimensions === null) {
        setPositionerCssSize(positionerElement, "max-content");
        const dimensions = getCssDimensions(popupElement);
        committedDimensions = dimensions;
        setPositionerCssSize(positionerElement, dimensions);
        restoreMeasurementOverridesIncludingScale();
        params.onMeasureLayoutComplete?.(null, dimensions);
        isInitialRender = false;

        return () => {
          restoreAnchoringStyles();
          restoreAnchoringStyles = NOOP;
        };
      }

      // Subsequent runs while open (content changed without unmounting).
      setPositionerCssSize(positionerElement, "max-content");
      const previousDimensions = committedDimensions;
      const newDimensions = getCssDimensions(popupElement);
      committedDimensions = newDimensions;

      setPopupCssSize(popupElement, previousDimensions);
      restoreMeasurementOverridesIncludingScale();
      params.onMeasureLayoutComplete?.(previousDimensions, newDimensions);

      setPositionerCssSize(positionerElement, newDimensions);

      if (typeof requestAnimationFrame !== "undefined") {
        frame = requestAnimationFrame(() => {
          frame = undefined;
          setPopupCssSize(popupElement, newDimensions);
          cancelRevertWatcher = runOnceAnimationsFinish(
            popupElement,
            () => {
              popupElement.style.setProperty("--popup-width", "auto");
              popupElement.style.setProperty("--popup-height", "auto");
            },
            { waitForStartingStyle: true },
          );
        });
      }

      return () => {
        cancelPendingFrame();
        cancelRevertWatcher?.();
        cancelRevertWatcher = undefined;
        restoreAnchoringStyles();
        restoreAnchoringStyles = NOOP;
      };
    },
  );

  onCleanup(() => {
    cancelPendingFrame();
    cancelRevertWatcher?.();
    restoreAnchoringStyles();
  });
}
