export interface RunOnceAnimationsFinishOptions {
  /** Wait for animations registered on descendants too, not just `element` itself. */
  includeDescendants?: boolean;
  /**
   * If `element` currently has a `data-starting-style` attribute, wait for it to be removed
   * before checking for animations, instead of just waiting a frame. Entrance animations tied to
   * `[data-starting-style]` selectors haven't been registered yet while the attribute is still
   * present, so checking too early would see no animations and resolve immediately.
   */
  waitForStartingStyle?: boolean;
}

/**
 * Runs `callback` once every animation on `element` has finished. If an animation is canceled
 * mid-flight — which happens when a property it depends on changes while it plays — any
 * replacement animations are waited on too.
 *
 * Returns an abort function; calling it prevents `callback` from running.
 */
export function runOnceAnimationsFinish(
  element: HTMLElement,
  callback: () => void,
  options: boolean | RunOnceAnimationsFinishOptions = false,
) {
  const { includeDescendants = false, waitForStartingStyle = false } =
    typeof options === "boolean" ? { includeDescendants: options } : options;

  let aborted = false;
  let frame: number | undefined;
  let observer: MutationObserver | undefined;

  const abort = () => {
    aborted = true;
    if (frame !== undefined && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(frame);
    }
    frame = undefined;
    observer?.disconnect();
    observer = undefined;
  };

  if (typeof element.getAnimations !== "function") {
    callback();
    return abort;
  }

  function run() {
    frame = undefined;
    if (aborted) return;

    void Promise.all(
      element.getAnimations({ subtree: includeDescendants }).map((animation) => animation.finished),
    ).then(
      () => {
        if (!aborted) callback();
      },
      () => {
        if (aborted) return;
        // A rejection means an animation was canceled. Re-check: if new ones have started in
        // its place, wait for those instead of reporting completion early.
        const pending = element
          .getAnimations({ subtree: includeDescendants })
          .some((animation) => animation.pending || animation.playState !== "finished");
        if (pending) {
          run();
          return;
        }
        callback();
      },
    );
  }

  const scheduleRun = () => {
    if (typeof requestAnimationFrame === "undefined") run();
    else frame = requestAnimationFrame(run);
  };

  if (waitForStartingStyle && element.hasAttribute("data-starting-style")) {
    observer = new MutationObserver(() => {
      if (element.hasAttribute("data-starting-style")) return;
      observer?.disconnect();
      observer = undefined;
      run();
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-starting-style"] });
  } else {
    // Wait a frame so animations triggered by the change that scheduled this have been registered.
    scheduleRun();
  }

  return abort;
}
