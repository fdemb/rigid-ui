import { createSignal, onCleanup, Show } from "solid-js";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { fireEvent } from "@testing-library/dom";
import { flushMicrotasks, render } from "../../../test/test-utils";
import { REASONS } from "../../internals/reasons";
import { safePolygon } from "./safePolygon";
import { useHover } from "./useHover";
import type { FloatingContext, UseHoverProps } from "./useHover";

/**
 * Minimal structural stand-in for the floating root store. Mirrors what a real
 * integration (e.g. PopoverRoot) would provide: reactive accessors, a data ref
 * recording the last open event, and an openchange emitter.
 */
function createEvents() {
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  return {
    on(type: string, fn: (data: unknown) => void) {
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      set.add(fn);
      return () => set!.delete(fn);
    },
    off(type: string, fn: (data: unknown) => void) {
      listeners.get(type)?.delete(fn);
    },
    emit(type: string, data: unknown) {
      listeners.get(type)?.forEach((fn) => fn(data));
    },
  };
}

interface HarnessProps extends UseHoverProps {
  showReference?: boolean;
  initialOpen?: boolean;
  onOpenChange?: (open: boolean, details: Record<string, unknown>) => void;
}

function ReferenceButton(props: {
  onRef: (el: HTMLButtonElement | null) => void;
  handlers: Record<string, unknown>;
}) {
  onCleanup(() => props.onRef(null));
  return <button ref={(el) => props.onRef(el)} {...(props.handlers as any)} />;
}

function App(props: HarnessProps) {
  const [open, setOpenSignal] = createSignal(props.initialOpen ?? false);
  const [trigger, setTrigger] = createSignal<HTMLButtonElement | null>(null);
  let floatingEl: HTMLDivElement | null = null;

  const dataRef: FloatingContext["dataRef"] = {
    current: { openEvent: null, placement: "bottom" },
  };
  const events = createEvents();

  const context: FloatingContext = {
    open,
    setOpen(next, details) {
      if (next) {
        dataRef.current.openEvent = details?.event
          ? { type: (details.event as Event).type }
          : { type: "mouseover" };
      } else {
        dataRef.current.openEvent = null;
      }
      props.onOpenChange?.(next, details ?? {});
      setOpenSignal(next);
      events.emit("openchange", { open: next });
    },
    domReferenceElement: trigger,
    floatingElement: () => floatingEl,
    dataRef,
    events,
  };

  const { getReferenceProps, getFloatingProps } = useHover(context, props);

  return (
    <>
      <Show when={props.showReference !== false}>
        <ReferenceButton onRef={(el) => setTrigger(el)} handlers={getReferenceProps()} />
      </Show>
      <Show when={open()}>
        <div role="tooltip" ref={(el) => (floatingEl = el)} {...(getFloatingProps() as any)} />
      </Show>
    </>
  );
}

describe("useHover", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test("opens on mouseenter", async () => {
    render(() => <App />);

    fireEvent.mouseEnter(document.querySelector("button")!);
    await flushMicrotasks();
    expect(document.querySelector("[role=tooltip]")).not.toBe(null);
  });

  test("closes on mouseleave", async () => {
    render(() => <App />);

    const button = document.querySelector("button")!;
    fireEvent.mouseEnter(button);
    await flushMicrotasks();
    expect(document.querySelector("[role=tooltip]")).not.toBe(null);

    fireEvent.mouseLeave(button);
    await flushMicrotasks();
    expect(document.querySelector("[role=tooltip]")).toBe(null);
  });

  describe("prop: delay", () => {
    test("symmetric number", async () => {
      render(() => <App delay={1000} />);

      const button = document.querySelector("button")!;
      fireEvent.mouseEnter(button);

      vi.advanceTimersByTime(999);
      expect(document.querySelector("[role=tooltip]")).toBe(null);

      vi.advanceTimersByTime(1);
      await flushMicrotasks();
      expect(document.querySelector("[role=tooltip]")).not.toBe(null);
    });

    test("open", async () => {
      render(() => <App delay={{ open: 500 }} />);

      const button = document.querySelector("button")!;
      fireEvent.mouseEnter(button);

      vi.advanceTimersByTime(499);
      expect(document.querySelector("[role=tooltip]")).toBe(null);

      vi.advanceTimersByTime(1);
      await flushMicrotasks();
      expect(document.querySelector("[role=tooltip]")).not.toBe(null);
    });

    test("close", async () => {
      render(() => <App delay={{ close: 500 }} />);

      const button = document.querySelector("button")!;
      fireEvent.mouseEnter(button);
      await flushMicrotasks();

      fireEvent.mouseLeave(button);

      vi.advanceTimersByTime(499);
      expect(document.querySelector("[role=tooltip]")).not.toBe(null);

      vi.advanceTimersByTime(1);
      await flushMicrotasks();
      expect(document.querySelector("[role=tooltip]")).toBe(null);
    });

    test("open with close 0", async () => {
      render(() => <App delay={{ open: 500 }} />);

      const button = document.querySelector("button")!;
      fireEvent.mouseEnter(button);

      vi.advanceTimersByTime(499);

      fireEvent.mouseLeave(button);
      vi.advanceTimersByTime(1);
      await flushMicrotasks();

      expect(document.querySelector("[role=tooltip]")).toBe(null);
    });

    test("restMs + nullish open delay should respect restMs", async () => {
      render(() => <App restMs={100} delay={{ close: 100 }} />);

      const button = document.querySelector("button")!;
      fireEvent.mouseEnter(button);

      vi.advanceTimersByTime(99);
      expect(document.querySelector("[role=tooltip]")).toBe(null);
      await flushMicrotasks();
    });
  });

  test("restMs", async () => {
    render(() => <App restMs={100} />);

    const button = document.querySelector("button");

    function move(x: number, y: number) {
      const event = new MouseEvent("mousemove", { bubbles: true });
      Object.defineProperty(event, "movementX", { value: x });
      Object.defineProperty(event, "movementY", { value: y });
      button!.dispatchEvent(event);
    }

    move(10, 10);
    vi.advanceTimersByTime(99);

    move(10, 10);
    vi.advanceTimersByTime(1);

    expect(document.querySelector("[role=tooltip]")).toBe(null);

    move(10, 10);
    vi.advanceTimersByTime(100);
    await flushMicrotasks();

    expect(document.querySelector("[role=tooltip]")).not.toBe(null);
  });

  test("restMs does not reset timer for minor mouse movement", async () => {
    render(() => <App restMs={100} />);

    const button = document.querySelector("button");

    function move(x: number, y: number) {
      const event = new MouseEvent("mousemove", { bubbles: true });
      Object.defineProperty(event, "movementX", { value: x });
      Object.defineProperty(event, "movementY", { value: y });
      button!.dispatchEvent(event);
    }

    move(1, 0);
    vi.advanceTimersByTime(99);

    move(1, 0);
    vi.advanceTimersByTime(1);
    await flushMicrotasks();

    expect(document.querySelector("[role=tooltip]")).not.toBe(null);
  });

  test("mouseleave on the floating element closes it (mouse)", async () => {
    render(() => <App />);

    const button = document.querySelector("button")!;
    fireEvent.mouseEnter(button);
    await flushMicrotasks();
    expect(document.querySelector("[role=tooltip]")).not.toBe(null);

    button.dispatchEvent(
      new MouseEvent("mouseleave", {
        relatedTarget: document.querySelector("[role=tooltip]")!,
      }),
    );
    await flushMicrotasks();

    expect(document.querySelector("[role=tooltip]")).toBe(null);
  });

  test("does not show after delay if domReference changes", async () => {
    // Solid's render has no `rerender`; a signal driving the harness prop is the same
    // reactive contract.
    const [showReference, setShowReference] = createSignal(true);
    render(() => <App delay={1000} showReference={showReference()} />);

    const button = document.querySelector("button")!;
    fireEvent.mouseEnter(button);
    vi.advanceTimersByTime(1);

    setShowReference(false);
    await flushMicrotasks();
    vi.advanceTimersByTime(999);
    await flushMicrotasks();

    expect(document.querySelector("[role=tooltip]")).toBe(null);
  });

  test("reason string", async () => {
    const onOpenChange = vi.fn();
    render(() => <App onOpenChange={onOpenChange} />);

    const button = document.querySelector("button")!;
    fireEvent.mouseEnter(button);
    await flushMicrotasks();

    expect(onOpenChange.mock.calls[0][0]).toBe(true);
    expect(onOpenChange.mock.calls[0][1].reason).toBe(REASONS.triggerHover);

    fireEvent.mouseLeave(button);
  });

  test("blockPointerEvents locks the body while open and restores it on close", async () => {
    render(() => <App handleClose={safePolygon({ blockPointerEvents: true })} />);

    const button = document.querySelector("button")!;
    fireEvent.mouseEnter(button);
    await flushMicrotasks();

    expect(document.body.style.pointerEvents).toBe("none");
    expect(button.style.pointerEvents).toBe("auto");
    const tooltip = document.querySelector<HTMLElement>("[role=tooltip]")!;
    expect(tooltip.style.pointerEvents).toBe("auto");

    fireEvent.mouseLeave(button);
    expect(document.body.style.pointerEvents).toBe("");
    expect(button.style.pointerEvents).toBe("");
  });

  // Skipped upstream as well: restMs never engages for touch input.
  test.skip("restMs is always 0 for touch input", () => {});
});
