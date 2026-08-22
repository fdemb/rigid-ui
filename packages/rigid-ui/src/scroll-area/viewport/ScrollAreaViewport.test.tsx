import { createSignal, Errored, Show } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { ScrollArea } from "../index";
import { SCROLL_TIMEOUT } from "../constants";
import {
  SCROLLABLE_CONTENT_SIZE,
  VIEWPORT_SIZE,
  scrollViewport,
} from "../../../test/ScrollAreaFixture";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";

describe("<ScrollArea.Viewport />", () => {
  it("throws a descriptive error when rendered outside <ScrollArea.Root>", () => {
    let caught: unknown;
    // An uncaught throw halts Solid's reactive system for the rest of the module, so the error
    // has to be captured by a boundary rather than asserted with `expect(...).toThrow()`.
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <ScrollArea.Viewport />
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: ScrollArea parts must be used within <ScrollArea.Root>.",
    );
  });

  it("forwards native props, class, style, and refs", () => {
    let viewportRef: HTMLDivElement | undefined;

    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Viewport
          ref={(element) => (viewportRef = element)}
          class="viewport-class"
          data-testid="viewport"
        />
      </ScrollArea.Root>
    ));

    const viewport = screen.getByTestId("viewport");
    expect(viewportRef).toBe(viewport);
    expect(viewport).toHaveClass("viewport-class");
    expect(viewport).toHaveAttribute("role", "presentation");
  });

  it("handles a user scroll callback unmounting the viewport", async () => {
    const [mounted, setMounted] = createSignal(true);

    render(() => (
      <ScrollArea.Root>
        <Show when={mounted()}>
          <ScrollArea.Viewport data-testid="viewport" onScroll={() => setMounted(false)} />
        </Show>
      </ScrollArea.Root>
    ));

    expect(() => fireEvent.scroll(screen.getByTestId("viewport"))).not.toThrow();
    await flushMicrotasks();
    expect(screen.queryByTestId("viewport")).toBe(null);
  });

  describe("data-scrolling attribute", () => {
    function renderScrollable() {
      render(() => (
        <ScrollArea.Root data-testid="root" style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      ));
      return screen.getByTestId("viewport");
    }

    it("adds [data-scrolling] on both axes and removes it after the timeout", async () => {
      vi.useFakeTimers();
      const viewport = renderScrollable();

      expect(viewport).not.toHaveAttribute("data-scrolling");

      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollTop: 1 });
      await flushMicrotasks();

      expect(viewport).toHaveAttribute("data-scrolling", "");

      // Still scrolling one tick short of the timeout.
      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT - 1);
      expect(viewport).toHaveAttribute("data-scrolling", "");

      await vi.advanceTimersByTimeAsync(1);
      expect(viewport).not.toHaveAttribute("data-scrolling");

      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollLeft: 1 });
      await flushMicrotasks();

      expect(viewport).toHaveAttribute("data-scrolling", "");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT);
      expect(viewport).not.toHaveAttribute("data-scrolling");
    });

    it("ignores data-scrolling during programmatic scroll", async () => {
      vi.useFakeTimers();
      const viewport = renderScrollable();

      // No user interaction before the scroll event, as with `scrollTo()`.
      scrollViewport(viewport, { scrollTop: 1 });
      await flushMicrotasks();

      expect(viewport).not.toHaveAttribute("data-scrolling");
    });

    it("adds [data-scrolling] in touch modality even when the gesture delivers no events", async () => {
      vi.useFakeTimers();
      const viewport = renderScrollable();

      // The initial touch is delivered normally and establishes touch modality.
      fireEvent.pointerDown(viewport, { pointerType: "touch" });

      // A touch that catches an in-flight momentum scroll or rubber-band bounce is consumed
      // natively by WebKit: no touch or pointer events fire for the whole gesture, only scroll
      // events after an arbitrary pause.
      await vi.advanceTimersByTimeAsync(200);
      scrollViewport(viewport, { scrollTop: 1 });
      await flushMicrotasks();

      expect(viewport).toHaveAttribute("data-scrolling", "");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT);
      expect(viewport).not.toHaveAttribute("data-scrolling");
    });

    it("keeps ignoring programmatic scrolls in mouse modality", async () => {
      vi.useFakeTimers();
      const viewport = renderScrollable();

      fireEvent.pointerDown(viewport, { pointerType: "mouse" });

      await vi.advanceTimersByTimeAsync(200);
      scrollViewport(viewport, { scrollTop: 1 });
      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT);

      expect(viewport).not.toHaveAttribute("data-scrolling");
    });

    it("restores programmatic scroll suppression after modality flips back to mouse", async () => {
      vi.useFakeTimers();
      const viewport = renderScrollable();
      const root = screen.getByTestId("root");

      fireEvent.pointerDown(viewport, { pointerType: "touch" });
      scrollViewport(viewport, { scrollTop: 1 });
      await flushMicrotasks();

      expect(viewport).toHaveAttribute("data-scrolling", "");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT);
      expect(viewport).not.toHaveAttribute("data-scrolling");

      // A mouse pointermove on the root (not the viewport, whose own handlers mark user
      // interaction) switches back to mouse modality.
      fireEvent.pointerMove(root, { pointerType: "mouse" });
      scrollViewport(viewport, { scrollTop: 2 });
      await flushMicrotasks();

      expect(viewport).not.toHaveAttribute("data-scrolling");
    });
  });

  describe.skipIf(isJSDOM)("subtree animations", () => {
    it("recomputes overflow after a subtree animation finishes", async () => {
      let scrollWidth = 100;
      let resolveAnimation: () => void = () => {};
      const finished = new Promise<void>((resolve) => {
        resolveAnimation = resolve;
      });
      const getAnimations = vi.fn(() => [{ finished }] as unknown as Animation[]);

      render(() => (
        <ScrollArea.Root data-testid="root">
          <ScrollArea.Viewport
            ref={(node) => {
              Object.defineProperties(node, {
                clientHeight: { configurable: true, value: 100 },
                clientWidth: { configurable: true, value: 100 },
                scrollHeight: { configurable: true, value: 100 },
                scrollWidth: { configurable: true, get: () => scrollWidth },
                getAnimations: { configurable: true, value: getAnimations },
              });
            }}
          />
          <ScrollArea.Scrollbar orientation="horizontal" keepMounted>
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const root = screen.getByTestId("root");
      await waitFor(() => expect(getAnimations).toHaveBeenCalled());
      expect(root).not.toHaveAttribute("data-has-overflow-x");

      scrollWidth = 1000;
      resolveAnimation();
      await finished;

      await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-x"));
    });

    it("ignores an animation finishing after its viewport unmounts", async () => {
      let resolveAnimation: () => void = () => {};
      const finished = new Promise<void>((resolve) => {
        resolveAnimation = resolve;
      });
      const getAnimations = vi.fn(() => [{ finished }] as unknown as Animation[]);
      const [mounted, setMounted] = createSignal(true);

      render(() => (
        <ScrollArea.Root>
          <Show when={mounted()}>
            <ScrollArea.Viewport
              data-testid="viewport"
              ref={(node) => {
                Object.defineProperty(node, "getAnimations", {
                  configurable: true,
                  value: getAnimations,
                });
              }}
            />
          </Show>
        </ScrollArea.Root>
      ));

      await waitFor(() => expect(getAnimations).toHaveBeenCalled());

      setMounted(false);
      await waitFor(() => expect(screen.queryByTestId("viewport")).toBe(null));

      resolveAnimation();
      await expect(finished).resolves.toBeUndefined();
      await flushMicrotasks();
    });
  });

  describe.skipIf(isJSDOM)("overflow data attributes", () => {
    it("applies data attributes on the viewport", async () => {
      render(() => (
        <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div
              style={{
                width: `${SCROLLABLE_CONTENT_SIZE}px`,
                height: `${SCROLLABLE_CONTENT_SIZE}px`,
              }}
            />
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport");

      await waitFor(() => expect(viewport).toHaveAttribute("data-has-overflow-x"));
      expect(viewport).toHaveAttribute("data-has-overflow-y");
      expect(viewport).not.toHaveAttribute("data-overflow-x-start");
      expect(viewport).toHaveAttribute("data-overflow-x-end");
      expect(viewport).not.toHaveAttribute("data-overflow-y-start");
      expect(viewport).toHaveAttribute("data-overflow-y-end");
    });
  });

  // Only Safari reports an out-of-range `scrollTop`/`scrollLeft` while rubber-banding, and the
  // browser clamps the property on assignment, so the getter is mocked to emulate it against real
  // layout.
  describe.skipIf(isJSDOM)("overscroll feedback", () => {
    const CONTENT_SIZE = 1000;
    const MAX_SCROLL = CONTENT_SIZE - VIEWPORT_SIZE;

    async function renderScrollArea(orientation: "vertical" | "horizontal") {
      render(() => (
        <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div
              style={{
                width: orientation === "horizontal" ? `${CONTENT_SIZE}px` : "100%",
                height: orientation === "vertical" ? `${CONTENT_SIZE}px` : "100%",
              }}
            />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation={orientation} data-testid="scrollbar" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      const scrollbar = screen.getByTestId("scrollbar");
      const thumb = screen.getByTestId("thumb");
      const axis = orientation === "vertical" ? "height" : "width";
      await waitFor(() => expect(thumb.getBoundingClientRect()[axis]).toBeGreaterThan(0));

      return { viewport, scrollbar, thumb };
    }

    function overscroll(viewport: HTMLDivElement, prop: "scrollTop" | "scrollLeft", value: number) {
      Object.defineProperty(viewport, prop, { configurable: true, get: () => value });
      fireEvent.scroll(viewport);
    }

    it("shrinks and pins the thumb to the start edge while overscrolling past the top", async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea("vertical");
      const restingHeight = thumb.getBoundingClientRect().height;

      overscroll(viewport, "scrollTop", -50);

      // Shrinks, but damped by the content length rather than subtracting the raw pixels (a 1:1
      // subtraction of 50px would collapse this thumb to its minimum size).
      await waitFor(() => expect(thumb.getBoundingClientRect().height).toBeLessThan(restingHeight));
      expect(thumb.getBoundingClientRect().height).toBeGreaterThan(restingHeight * 0.9);
      expect(thumb.getBoundingClientRect().top).toBeCloseTo(
        scrollbar.getBoundingClientRect().top,
        0,
      );
    });

    it("shrinks and pins the thumb to the end edge while overscrolling past the bottom", async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea("vertical");
      const restingHeight = thumb.getBoundingClientRect().height;

      overscroll(viewport, "scrollTop", MAX_SCROLL + 50);

      await waitFor(() => expect(thumb.getBoundingClientRect().height).toBeLessThan(restingHeight));
      expect(thumb.getBoundingClientRect().height).toBeGreaterThan(restingHeight * 0.9);
      expect(thumb.getBoundingClientRect().bottom).toBeCloseTo(
        scrollbar.getBoundingClientRect().bottom,
        0,
      );
    });

    it("restores the resting thumb size once the viewport settles back into range", async () => {
      const { viewport, thumb } = await renderScrollArea("vertical");
      const restingHeight = thumb.getBoundingClientRect().height;

      overscroll(viewport, "scrollTop", -50);
      await waitFor(() => expect(thumb.getBoundingClientRect().height).toBeLessThan(restingHeight));

      overscroll(viewport, "scrollTop", 100);
      await waitFor(() =>
        expect(thumb.getBoundingClientRect().height).toBeCloseTo(restingHeight, 0),
      );
    });

    it("shrinks and pins the horizontal thumb to the inline start while overscrolling", async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea("horizontal");
      const restingWidth = thumb.getBoundingClientRect().width;

      overscroll(viewport, "scrollLeft", -50);

      await waitFor(() => expect(thumb.getBoundingClientRect().width).toBeLessThan(restingWidth));
      expect(thumb.getBoundingClientRect().width).toBeGreaterThan(restingWidth * 0.9);
      expect(thumb.getBoundingClientRect().left).toBeCloseTo(
        scrollbar.getBoundingClientRect().left,
        0,
      );
    });

    it("shrinks and pins the horizontal thumb to the inline end while overscrolling", async () => {
      const { viewport, scrollbar, thumb } = await renderScrollArea("horizontal");
      const restingWidth = thumb.getBoundingClientRect().width;

      overscroll(viewport, "scrollLeft", MAX_SCROLL + 50);

      await waitFor(() => expect(thumb.getBoundingClientRect().width).toBeLessThan(restingWidth));
      expect(thumb.getBoundingClientRect().width).toBeGreaterThan(restingWidth * 0.9);
      expect(thumb.getBoundingClientRect().right).toBeCloseTo(
        scrollbar.getBoundingClientRect().right,
        0,
      );
    });
  });
});
