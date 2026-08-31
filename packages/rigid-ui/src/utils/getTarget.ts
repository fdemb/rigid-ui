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

/**
 * Narrows {@link getTarget} to an `Element`, for the callers that classify the target by its
 * position in the tree. Non-element targets (`document`, `window`) become `null`.
 */
export function getTargetElement(event: Event): Element | null {
  const target = getTarget(event);
  return target instanceof Element ? target : null;
}
