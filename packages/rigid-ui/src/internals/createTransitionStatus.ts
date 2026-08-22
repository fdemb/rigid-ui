import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

/**
 * Solid port of Base UI's
 * `reference/base-ui/packages/react/src/internals/useTransitionStatus.ts`.
 *
 * React implements the lifecycle with render-phase state updates; Solid expresses it as an
 * effect observing `open()` plus frame scheduling. The observable contract is identical:
 * - opening mounts with `'starting'` (or `'idle'` when idle states are enabled);
 * - without idle states, `'starting'` clears one frame later so CSS entrance animations can
 *   register before the attribute disappears;
 * - closing reports `'ending'` immediately (or one frame later with `deferEndingState`);
 * - `setMounted(false)` after exit animations settle resets the status;
 * - an element that mounts already open does not animate unless `animateInitialOpen` is set.
 */
export type TransitionStatus = "starting" | "ending" | "idle" | undefined;

export interface CreateTransitionStatusOptions {
  /**
   * Enables the `'idle'` state between `'starting'` and `'ending'`, for styles that must apply
   * while the popup is fully shown.
   */
  enableIdleState?: boolean;
  /** Delays the `'ending'` status by a frame. */
  deferEndingState?: boolean;
  /**
   * Makes an element that mounts already open still go through `'starting'`. Off by default so
   * content open on first render (SSR markup, `defaultOpen`) does not animate in.
   */
  animateInitialOpen?: boolean;
}

export interface TransitionStatusResult {
  mounted: Accessor<boolean>;
  setMounted: (value: boolean) => void;
  transitionStatus: Accessor<TransitionStatus>;
}

type FrameHandle = number;

function requestFrame(callback: () => void): FrameHandle {
  if (typeof requestAnimationFrame === "undefined") {
    // Node typings type `setTimeout` as returning `Timeout`; only the handle's opacity matters.
    return setTimeout(callback, 0) as unknown as number;
  }
  return requestAnimationFrame(callback);
}

function cancelFrame(handle: FrameHandle) {
  if (typeof cancelAnimationFrame === "undefined") {
    window.clearTimeout(handle);
    return;
  }
  cancelAnimationFrame(handle);
}

export function createTransitionStatus(
  open: Accessor<boolean>,
  options: CreateTransitionStatusOptions = {},
): TransitionStatusResult {
  const { enableIdleState = false, deferEndingState = false, animateInitialOpen = false } = options;

  const [transitionStatus, setTransitionStatus] = createSignal<TransitionStatus>(
    open() && enableIdleState ? "idle" : undefined,
  );
  // Starting at `false` while open lets the open && !mounted branch below run on the first
  // effect pass, which produces the 'starting' phase — unless initial animation is requested
  // off (the default), matching SSR'd/defaultOpen content.
  const [mounted, setMounted] = createSignal(open() && !animateInitialOpen);

  createEffect(
    () => ({ isOpen: open(), isMounted: mounted(), current: transitionStatus() }),
    ({ isOpen, isMounted, current }) => {
      if (isOpen && !isMounted) {
        setMounted(true);
        setTransitionStatus("starting");
        return;
      }

      if (!isOpen && isMounted && current !== "ending") {
        if (deferEndingState) {
          const frame = requestFrame(() => setTransitionStatus("ending"));
          onCleanup(() => cancelFrame(frame));
        } else {
          setTransitionStatus("ending");
        }
        return;
      }

      if (!isOpen && !isMounted && current === "ending") {
        setTransitionStatus(undefined);
      }
    },
  );

  createEffect(
    () => ({ isOpen: open(), isMounted: mounted(), current: transitionStatus() }),
    ({ isOpen, isMounted, current }) => {
      if (!isOpen) return;

      if (!enableIdleState) {
        // Give entrance animations one frame to register before dropping data-starting-style.
        const frame = requestFrame(() => setTransitionStatus(undefined));
        onCleanup(() => cancelFrame(frame));
        return;
      }

      if (isMounted && current !== "idle") {
        setTransitionStatus("starting");
      }
      const frame = requestFrame(() => setTransitionStatus("idle"));
      onCleanup(() => cancelFrame(frame));
    },
  );

  return { mounted, setMounted, transitionStatus };
}
