/**
 * Runs `callback` once every animation on `element` has finished. If an animation is canceled
 * mid-flight — which happens when a property it depends on changes while it plays — any
 * replacement animations are waited on too.
 *
 * Returns an abort function; calling it prevents `callback` from running.
 */
export function runOnceAnimationsFinish(element: HTMLElement, callback: () => void) {
  let aborted = false;
  let frame: number | undefined;

  const abort = () => {
    aborted = true;
    if (frame !== undefined && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(frame);
    }
    frame = undefined;
  };

  if (typeof element.getAnimations !== "function") {
    callback();
    return abort;
  }

  function run() {
    frame = undefined;
    if (aborted) return;

    void Promise.all(element.getAnimations().map((animation) => animation.finished)).then(
      () => {
        if (!aborted) callback();
      },
      () => {
        if (aborted) return;
        // A rejection means an animation was canceled. Re-check: if new ones have started in
        // its place, wait for those instead of reporting completion early.
        const pending = element
          .getAnimations()
          .some((animation) => animation.pending || animation.playState !== "finished");
        if (pending) {
          run();
          return;
        }
        callback();
      },
    );
  }

  // Wait a frame so animations triggered by the change that scheduled this have been registered.
  if (typeof requestAnimationFrame === "undefined") run();
  else frame = requestAnimationFrame(run);

  return abort;
}
