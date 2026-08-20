import { round, type Dimensions } from "@floating-ui/utils";
import { getComputedStyle, isHTMLElement } from "@floating-ui/utils/dom";

/**
 * Reads an element's rendered size from computed style, falling back to `offsetWidth`/`offsetHeight`
 * when they disagree (e.g. a `transform: scale()` in effect, or a testing environment that leaves
 * `width`/`height` as empty strings for SVG elements).
 */
export function getCssDimensions(element: Element): Dimensions {
  const css = getComputedStyle(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;

  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }

  return { width, height };
}
