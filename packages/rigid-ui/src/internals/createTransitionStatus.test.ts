import { createRoot, createSignal } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { flushMicrotasks } from "../../test/test-utils";
import { createTransitionStatus, type TransitionStatusResult } from "./createTransitionStatus";

/**
 * Behavioral contracts of Base UI's `useTransitionStatus`
 * (`reference/base-ui/packages/react/src/internals/useTransitionStatus.ts`). Pinned directly so
 * every popup family member shares the exact lifecycle.
 *
 * Signal writes must happen outside the owning root (Solid 2 forbids writes inside owned
 * scopes), so each test creates the root, then drives and asserts outside of it.
 */
function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

describe("createTransitionStatus", () => {
  it("starts closed and unmounted with no status", () => {
    const [open] = createSignal(false);
    createRoot((dispose) => {
      const result = createTransitionStatus(open);
      expect(result.mounted()).toBe(false);
      expect(result.transitionStatus()).toBeUndefined();
      dispose();
    });
  });

  it("mounts with a starting status when opened, clearing it after a frame", async () => {
    const [open, setOpen] = createSignal(false);
    let result!: TransitionStatusResult;
    const dispose = createRoot((disposer) => {
      result = createTransitionStatus(open);
      return disposer;
    });

    setOpen(true);
    await flushMicrotasks();
    expect(result.mounted()).toBe(true);
    expect(result.transitionStatus()).toBe("starting");

    await nextFrame();
    expect(result.transitionStatus()).toBeUndefined();
    dispose();
  });

  it("does not animate an element that is open on creation by default", async () => {
    const [open] = createSignal(true);
    let result!: TransitionStatusResult;
    const dispose = createRoot((disposer) => {
      result = createTransitionStatus(open);
      return disposer;
    });

    expect(result.mounted()).toBe(true);
    expect(result.transitionStatus()).toBeUndefined();

    await nextFrame();
    expect(result.transitionStatus()).toBeUndefined();
    dispose();
  });

  it("animates the initial open when animateInitialOpen is set", async () => {
    const [open] = createSignal(true);
    let result!: TransitionStatusResult;
    const dispose = createRoot((disposer) => {
      result = createTransitionStatus(open, { animateInitialOpen: true });
      return disposer;
    });

    expect(result.mounted()).toBe(false);
    expect(result.transitionStatus()).toBeUndefined();

    // The first effect pass observes open && !mounted and enters 'starting'.
    await flushMicrotasks();
    expect(result.mounted()).toBe(true);
    expect(result.transitionStatus()).toBe("starting");

    await nextFrame();
    expect(result.transitionStatus()).toBeUndefined();
    dispose();
  });

  it("reports ending while closing until unmount clears it", async () => {
    const [open, setOpen] = createSignal(false);
    let result!: TransitionStatusResult;
    const dispose = createRoot((disposer) => {
      result = createTransitionStatus(open);
      return disposer;
    });

    setOpen(true);
    await flushMicrotasks();
    await nextFrame();

    setOpen(false);
    await flushMicrotasks();
    expect(result.transitionStatus()).toBe("ending");
    expect(result.mounted()).toBe(true);

    // Components call setMounted(false) once exit animations finish.
    result.setMounted(false);
    await flushMicrotasks();
    expect(result.transitionStatus()).toBeUndefined();
    dispose();
  });

  it("keeps an idle status between starting and ending with enableIdleState", async () => {
    const [open, setOpen] = createSignal(false);
    let result!: TransitionStatusResult;
    const dispose = createRoot((disposer) => {
      result = createTransitionStatus(open, { enableIdleState: true });
      return disposer;
    });

    setOpen(true);
    await flushMicrotasks();
    expect(result.transitionStatus()).toBe("starting");

    await nextFrame();
    expect(result.transitionStatus()).toBe("idle");

    setOpen(false);
    await flushMicrotasks();
    expect(result.transitionStatus()).toBe("ending");
    dispose();
  });

  it("defers the ending status by one frame with deferEndingState", async () => {
    const [open, setOpen] = createSignal(false);
    let result!: TransitionStatusResult;
    const dispose = createRoot((disposer) => {
      result = createTransitionStatus(open, { deferEndingState: true });
      return disposer;
    });

    setOpen(true);
    await flushMicrotasks();
    setOpen(false);
    // The status holds at its previous value until the deferred frame lands.
    await flushMicrotasks();
    expect(result.transitionStatus()).toBe("starting");

    await nextFrame();
    expect(result.transitionStatus()).toBe("ending");
    dispose();
  });
});
