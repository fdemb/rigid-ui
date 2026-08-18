import { waitFor } from "@testing-library/dom";
import { expect } from "vite-plus/test";

export { cleanup, render } from "@solidjs/testing-library";

export const isJSDOM = typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

export async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

/** Resolves after a single animation frame, which is when Floating UI applies a new position. */
export function waitSingleFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Waits until the positioner has run its first positioning pass. The positioner is transparent
 * until then, so reading its rect earlier measures it at the origin.
 */
export async function waitForPositioned(positioner: HTMLElement) {
  await waitFor(() => {
    expect(positioner.style.opacity).not.toBe("0");
  });
  await waitFor(() => {
    expect(positioner).toBeVisible();
  });
}
