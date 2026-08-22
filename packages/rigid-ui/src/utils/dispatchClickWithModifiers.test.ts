import { describe, expect, it } from "vite-plus/test";
import { dispatchClickWithModifiers } from "./dispatchClickWithModifiers";

const sourceEvent = { shiftKey: true, ctrlKey: true, altKey: false, metaKey: false };

function captureClick(target: Element) {
  const events: PointerEvent[] = [];
  target.addEventListener("click", (event) => events.push(event as PointerEvent));
  return events;
}

describe("dispatchClickWithModifiers", () => {
  it("dispatches an untrusted click carrying the source event's modifier state", () => {
    const target = document.createElement("div");
    const events = captureClick(target);

    dispatchClickWithModifiers(target, sourceEvent);

    expect(events).toHaveLength(1);
    const event = events[0];
    expect(event.detail).toBe(0);
    expect(event.shiftKey).toBe(true);
    expect(event.ctrlKey).toBe(true);
    expect(event.altKey).toBe(false);
    expect(event.metaKey).toBe(false);
  });

  it("bubbles, is cancelable, composed, and targets the given element", () => {
    const parent = document.createElement("div");
    const target = parent.appendChild(document.createElement("span"));
    let bubbled: Event | undefined;
    parent.addEventListener("click", (event) => {
      bubbled = event;
      event.preventDefault();
    });

    dispatchClickWithModifiers(target, {
      shiftKey: false,
      ctrlKey: false,
      altKey: true,
      metaKey: true,
    });

    expect(bubbled).toBeDefined();
    expect(bubbled!.target).toBe(target);
    expect(bubbled!.cancelable).toBe(true);
    expect(bubbled!.composed).toBe(true);
  });

  it("defaults detail to the keyboard convention and honors an explicit override", () => {
    const target = document.createElement("div");
    const events = captureClick(target);

    dispatchClickWithModifiers(target, sourceEvent);
    dispatchClickWithModifiers(target, sourceEvent, { detail: 1 });

    expect(events.map((event) => event.detail)).toEqual([0, 1]);
  });
});
