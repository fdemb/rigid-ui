import { createRoot, createSignal } from "solid-js";
import { describe, expect, it, vi } from "vite-plus/test";
import { createOpenChangeComplete } from "./createOpenChangeComplete";

/** Contracts of Base UI's useOpenChangeComplete, pinned at the composable level. */
describe("createOpenChangeComplete", () => {
  it("fires immediately when the element has no animation", () => {
    const [element, setElement] = createSignal<HTMLElement | null>(null);
    let dispose!: () => void;
    const onComplete = vi.fn();

    dispose = createRoot((d) => {
      createOpenChangeComplete({ open: true, element, onComplete });
      return d;
    });

    const div = document.createElement("div");
    // jsdom has no getAnimations; runOnceAnimationsFinish resolves on the next frame.
    setElement(div);

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          expect(onComplete).toHaveBeenCalledTimes(1);
          dispose();
          resolve();
        });
      });
    });
  });

  it("does not fire while disabled", () => {
    const [element, setElement] = createSignal<HTMLElement | null>(null);
    const [enabled, setEnabled] = createSignal(false);
    let dispose!: () => void;
    const onComplete = vi.fn();

    dispose = createRoot((d) => {
      createOpenChangeComplete({ enabled, open: true, element, onComplete });
      return d;
    });

    setElement(document.createElement("div"));

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          expect(onComplete).not.toHaveBeenCalled();
          setEnabled(true);
          dispose();
          resolve();
        });
      });
    });
  });

  it("aborts the pending wait when the root disposes", () => {
    const [element, setElement] = createSignal<HTMLElement | null>(null);
    const onComplete = vi.fn();
    let dispose!: () => void;

    dispose = createRoot((d) => {
      createOpenChangeComplete({ open: false, element, onComplete });
      return d;
    });

    setElement(document.createElement("div"));
    dispose();

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          expect(onComplete).not.toHaveBeenCalled();
          resolve();
        });
      });
    });
  });
});
