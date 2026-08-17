export { cleanup, render } from "@solidjs/testing-library";

export const isJSDOM =
  typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

export async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}
