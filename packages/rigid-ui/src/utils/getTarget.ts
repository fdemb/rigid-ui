/**
 * Returns the event's true target. `composedPath()[0]` sees through shadow boundaries, where
 * `event.target` is retargeted to the host element.
 */
export function getTarget(event: Event): EventTarget | null {
  if (typeof event.composedPath === "function") {
    return event.composedPath()[0] ?? event.target;
  }
  return event.target;
}
