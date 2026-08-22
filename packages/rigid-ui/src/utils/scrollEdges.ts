import { clamp } from "./clamp";

/**
 * Subpixel layout leaves a fractional gap at the scroll extremes, so a viewport scrolled all the
 * way still reports an offset short of its maximum. Treat anything within this many pixels of an
 * edge as sitting exactly on it.
 */
export const SCROLL_EDGE_TOLERANCE_PX = 1;

export function normalizeScrollOffset(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }

  const clamped = clamp(value, 0, max);
  const startDistance = clamped;
  const endDistance = max - clamped;
  const withinStartTolerance = startDistance <= SCROLL_EDGE_TOLERANCE_PX;
  const withinEndTolerance = endDistance <= SCROLL_EDGE_TOLERANCE_PX;

  // A range shorter than twice the tolerance is within reach of both edges; snap to the nearer.
  if (withinStartTolerance && withinEndTolerance) {
    return startDistance <= endDistance ? 0 : max;
  }
  if (withinStartTolerance) {
    return 0;
  }
  if (withinEndTolerance) {
    return max;
  }

  return clamped;
}
