import { render as solidRender } from "@solidjs/web";
import userEvent from "@testing-library/user-event";
import type { JSX } from "@solidjs/web";

const disposers = new Set<() => void>();

export const isJSDOM =
  typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

export async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

export async function render(ui: () => JSX.Element) {
  const container = document.createElement("div");
  document.body.append(container);

  const disposeRoot = solidRender(ui, container);
  const unmount = () => {
    if (!disposers.delete(unmount)) return;
    disposeRoot();
    container.remove();
  };
  disposers.add(unmount);

  await flushMicrotasks();

  return {
    container,
    unmount,
    user: userEvent.setup(),
  };
}

export function cleanup() {
  for (const dispose of [...disposers]) dispose();
  document.body.replaceChildren();
}
