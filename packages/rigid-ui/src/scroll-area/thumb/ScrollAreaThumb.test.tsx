import { createSignal, Errored, Show } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { DirectionProvider } from "../../direction-provider/DirectionProvider";
import { ScrollArea } from "../index";
import { SCROLL_TIMEOUT } from "../constants";
import {
  VIEWPORT_SIZE,
  mockViewportMetrics,
  scrollViewport,
} from "../../../test/ScrollAreaFixture";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";

/**
 * Stands in for the browser's pointer capture bookkeeping, which JSDOM does not implement, and
 * exposes a way to drop the capture without delivering a release.
 */
function defineThumbPointerCapture(thumb: HTMLElement) {
  let capturedId: number | null = null;

  Object.defineProperties(thumb, {
    setPointerCapture: {
      configurable: true,
      value: (pointerId: number) => {
        capturedId = pointerId;
      },
    },
    hasPointerCapture: {
      configurable: true,
      value: (pointerId: number) => pointerId === capturedId,
    },
    releasePointerCapture: {
      configurable: true,
      value: (pointerId: number) => {
        if (pointerId === capturedId) {
          capturedId = null;
        }
      },
    },
  });

  return {
    dropCapture() {
      capturedId = null;
    },
  };
}

describe("<ScrollArea.Thumb />", () => {
  it("throws a descriptive error when rendered outside <ScrollArea.Scrollbar>", () => {
    let caught: unknown;
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <ScrollArea.Root>
          <ScrollArea.Thumb />
        </ScrollArea.Root>
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: <ScrollArea.Thumb> must be used within <ScrollArea.Scrollbar>.",
    );
  });

  it("forwards the ref and reflects the scrollbar orientation", () => {
    let thumbRef: HTMLDivElement | undefined;

    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Scrollbar keepMounted orientation="horizontal">
          <ScrollArea.Thumb ref={(element) => (thumbRef = element)} data-testid="thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ));

    expect(thumbRef).toBe(screen.getByTestId("thumb"));
    expect(screen.getByTestId("thumb")).toHaveAttribute("data-orientation", "horizontal");
  });

  it("handles a thumb gesture when no viewport is mounted", async () => {
    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Scrollbar keepMounted>
          <ScrollArea.Thumb data-testid="thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ));

    const thumb = screen.getByTestId("thumb");
    defineThumbPointerCapture(thumb);

    fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(thumb, { clientY: 20, pointerId: 1, buttons: 1 });
    await flushMicrotasks();

    // Without a viewport there is nothing to scroll, so the drag never consumes the move.
    expect(thumb).not.toHaveAttribute("data-scrolling");
    expect(thumb.style.transform).toBe("");

    fireEvent.pointerUp(thumb, { pointerId: 1 });
    await flushMicrotasks();
    expect(thumb).not.toHaveAttribute("data-scrolling");
  });

  it("handles the scrollbar unmounting from a user pointer-move callback", async () => {
    const [mounted, setMounted] = createSignal(true);

    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Viewport data-testid="viewport" />
        <Show when={mounted()}>
          <ScrollArea.Scrollbar keepMounted data-testid="scrollbar">
            <ScrollArea.Thumb data-testid="thumb" onPointerMove={() => setMounted(false)} />
          </ScrollArea.Scrollbar>
        </Show>
      </ScrollArea.Root>
    ));

    const viewport = screen.getByTestId("viewport");
    const thumb = screen.getByTestId("thumb");
    defineThumbPointerCapture(thumb);

    fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
    expect(() =>
      fireEvent.pointerMove(thumb, { clientY: 20, pointerId: 1, buttons: 1 }),
    ).not.toThrow();
    await flushMicrotasks();

    expect(screen.queryByTestId("scrollbar")).toBe(null);
    expect(viewport.scrollTop).toBe(0);

    // The drag is still latched against a detached thumb; further moves must stay harmless.
    expect(() =>
      fireEvent.pointerMove(thumb, { clientY: 40, pointerId: 1, buttons: 1 }),
    ).not.toThrow();
    expect(viewport.scrollTop).toBe(0);
  });

  it("handles the viewport unmounting from a user pointer-up callback", async () => {
    const [mounted, setMounted] = createSignal(true);

    render(() => (
      <ScrollArea.Root>
        <Show when={mounted()}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ "scroll-snap-type": "y mandatory" }}
          />
        </Show>
        <ScrollArea.Scrollbar keepMounted>
          <ScrollArea.Thumb data-testid="thumb" onPointerUp={() => setMounted(false)} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ));

    const viewport = screen.getByTestId("viewport");
    const thumb = screen.getByTestId("thumb");
    defineThumbPointerCapture(thumb);

    fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
    expect(viewport.style.scrollSnapType).toBe("none");

    expect(() => fireEvent.pointerUp(thumb, { pointerId: 1 })).not.toThrow();
    await flushMicrotasks();
    expect(screen.queryByTestId("viewport")).toBe(null);
  });

  it("clears scrolling state on pointer cancel without releasing stale capture", async () => {
    render(() => (
      <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
        <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
          <div style={{ width: "200px", height: "1000px" }} />
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" data-testid="scrollbar" keepMounted>
          <ScrollArea.Thumb data-testid="thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ));

    const viewport = screen.getByTestId("viewport");
    const scrollbar = screen.getByTestId("scrollbar");
    const thumb = screen.getByTestId("thumb");

    mockViewportMetrics(viewport, { scrollWidth: VIEWPORT_SIZE });
    Object.defineProperty(viewport, "scrollTop", { configurable: true, writable: true, value: 0 });
    Object.defineProperties(scrollbar, { offsetHeight: { configurable: true, value: 200 } });
    Object.defineProperties(thumb, {
      offsetHeight: { configurable: true, value: 40 },
      setPointerCapture: { configurable: true, value: () => {} },
      hasPointerCapture: { configurable: true, value: () => false },
      releasePointerCapture: {
        configurable: true,
        value: () => {
          throw new Error("releasePointerCapture should not be called");
        },
      },
    });

    fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(thumb, { clientY: 20, pointerId: 1, buttons: 1 });

    await waitFor(() => expect(scrollbar).toHaveAttribute("data-scrolling"));

    // `pointercancel` releases the capture implicitly, so releasing again would throw.
    expect(() => fireEvent.pointerCancel(thumb, { pointerId: 1 })).not.toThrow();

    await waitFor(() => expect(scrollbar).not.toHaveAttribute("data-scrolling"));
  });

  it("clears horizontal scrolling state on pointer cancel", async () => {
    render(() => (
      <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
        <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
          <div style={{ width: "1000px", height: "200px" }} />
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar" keepMounted>
          <ScrollArea.Thumb data-testid="thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ));

    const viewport = screen.getByTestId("viewport");
    const scrollbar = screen.getByTestId("scrollbar");
    const thumb = screen.getByTestId("thumb");

    mockViewportMetrics(viewport, { scrollHeight: VIEWPORT_SIZE });
    Object.defineProperty(viewport, "scrollLeft", { configurable: true, writable: true, value: 0 });
    Object.defineProperties(scrollbar, { offsetWidth: { configurable: true, value: 200 } });
    Object.defineProperties(thumb, {
      offsetWidth: { configurable: true, value: 40 },
      setPointerCapture: { configurable: true, value: () => {} },
      hasPointerCapture: { configurable: true, value: () => false },
      releasePointerCapture: {
        configurable: true,
        value: () => {
          throw new Error("releasePointerCapture should not be called");
        },
      },
    });

    fireEvent.pointerDown(thumb, { button: 0, clientX: 0, pointerId: 1 });
    fireEvent.pointerMove(thumb, { clientX: 20, pointerId: 1, buttons: 1 });

    await waitFor(() => expect(scrollbar).toHaveAttribute("data-scrolling"));

    expect(() => fireEvent.pointerCancel(thumb, { pointerId: 1 })).not.toThrow();

    await waitFor(() => expect(scrollbar).not.toHaveAttribute("data-scrolling"));
  });

  describe("scroll snap", () => {
    function renderWithSnap() {
      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: "100%", height: "100%", "scroll-snap-type": "y mandatory" }}
          >
            <div style={{ width: "200px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      return { viewport: screen.getByTestId("viewport"), thumb: screen.getByTestId("thumb") };
    }

    it("disables viewport scroll snap while dragging and restores it on release", () => {
      const { viewport, thumb } = renderWithSnap();
      defineThumbPointerCapture(thumb);

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      expect(viewport.style.scrollSnapType).toBe("none");

      fireEvent.pointerUp(thumb, { pointerId: 1 });
      expect(viewport.style.scrollSnapType).toBe("y mandatory");
    });

    it("restores viewport scroll snap on pointer cancel", () => {
      const { viewport, thumb } = renderWithSnap();
      defineThumbPointerCapture(thumb);

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      expect(viewport.style.scrollSnapType).toBe("none");

      fireEvent.pointerCancel(thumb, { pointerId: 1 });
      expect(viewport.style.scrollSnapType).toBe("y mandatory");
    });

    it("ignores a second pointer while a drag is active", () => {
      const { viewport, thumb } = renderWithSnap();
      defineThumbPointerCapture(thumb);

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 2 });
      expect(viewport.style.scrollSnapType).toBe("none");

      // A release for the ignored pointer must not tear down the live drag.
      fireEvent.pointerUp(thumb, { pointerId: 2 });
      expect(viewport.style.scrollSnapType).toBe("none");

      fireEvent.pointerUp(thumb, { pointerId: 1 });
      expect(viewport.style.scrollSnapType).toBe("y mandatory");
    });

    it("lets a new pointer take over when capture was silently dropped", () => {
      const { viewport, thumb } = renderWithSnap();
      const capture = defineThumbPointerCapture(thumb);

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      expect(viewport.style.scrollSnapType).toBe("none");

      // The browser dropped capture without delivering `pointerup` or `pointercancel`, and the
      // contact's id never reappears (e.g. a lost touch), so a new pointer must be able to take
      // over the latched drag.
      capture.dropCapture();

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 2 });
      fireEvent.pointerUp(thumb, { pointerId: 2 });
      expect(viewport.style.scrollSnapType).toBe("y mandatory");
    });

    it("ignores non-primary pointer presses", () => {
      const { viewport, thumb } = renderWithSnap();
      const setPointerCapture = vi.fn();
      Object.defineProperty(thumb, "setPointerCapture", {
        configurable: true,
        value: setPointerCapture,
      });

      fireEvent.pointerDown(thumb, { button: 2, clientY: 0, pointerId: 1 });

      expect(viewport.style.scrollSnapType).toBe("y mandatory");
      expect(setPointerCapture).not.toHaveBeenCalled();
    });
  });

  describe("data-scrolling attribute", () => {
    it("adds [data-scrolling] on the thumb matching the scrolled axis", async () => {
      vi.useFakeTimers();

      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="vertical" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" keepMounted>
            <ScrollArea.Thumb data-testid="horizontal" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const verticalThumb = screen.getByTestId("vertical");
      const horizontalThumb = screen.getByTestId("horizontal");
      const viewport = screen.getByTestId("viewport");

      expect(verticalThumb).not.toHaveAttribute("data-scrolling");
      expect(horizontalThumb).not.toHaveAttribute("data-scrolling");

      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollTop: 1 });
      await flushMicrotasks();

      expect(verticalThumb).toHaveAttribute("data-scrolling", "");
      expect(horizontalThumb).not.toHaveAttribute("data-scrolling");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT - 1);

      expect(verticalThumb).toHaveAttribute("data-scrolling", "");
      expect(horizontalThumb).not.toHaveAttribute("data-scrolling");

      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollLeft: 1 });

      await vi.advanceTimersByTimeAsync(1);

      expect(verticalThumb).not.toHaveAttribute("data-scrolling");
      expect(horizontalThumb).toHaveAttribute("data-scrolling");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT - 2);

      expect(verticalThumb).not.toHaveAttribute("data-scrolling");
      expect(horizontalThumb).toHaveAttribute("data-scrolling");

      await vi.advanceTimersByTimeAsync(1);

      expect(verticalThumb).not.toHaveAttribute("data-scrolling");
      expect(horizontalThumb).not.toHaveAttribute("data-scrolling");
    });
  });

  describe.skipIf(isJSDOM)("dragging", () => {
    async function renderHorizontal(direction: "ltr" | "rtl" = "ltr") {
      render(() => (
        <DirectionProvider direction={direction}>
          <ScrollArea.Root style={{ width: "200px", height: "200px", direction }}>
            <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
              <div style={{ width: "1000px", height: "200px" }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="horizontal"
              data-testid="scrollbar"
              keepMounted
              style={{ display: "flex", width: "200px", height: "10px" }}
            >
              <ScrollArea.Thumb data-testid="thumb" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </DirectionProvider>
      ));

      const thumb = screen.getByTestId("thumb");
      await waitFor(() => expect(thumb.offsetWidth).toBeGreaterThan(0));

      return {
        viewport: screen.getByTestId("viewport"),
        scrollbar: screen.getByTestId("scrollbar"),
        thumb,
      };
    }

    it("updates the scroll position and takes pointer capture", async () => {
      const { scrollbar, thumb, viewport } = await renderHorizontal();
      const setPointerCapture = vi.spyOn(thumb, "setPointerCapture").mockImplementation(() => {});
      vi.spyOn(thumb, "hasPointerCapture").mockReturnValue(true);
      const releasePointerCapture = vi
        .spyOn(thumb, "releasePointerCapture")
        .mockImplementation(() => {});
      const rect = thumb.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      fireEvent.pointerDown(thumb, {
        button: 0,
        clientX: startX,
        clientY: startY,
        pointerId: 1,
      });
      fireEvent.pointerMove(thumb, {
        clientX: startX + 20,
        clientY: startY,
        pointerId: 1,
        buttons: 1,
      });

      expect(setPointerCapture).toHaveBeenCalledTimes(1);
      expect(viewport.scrollLeft).toBeGreaterThan(0);
      await waitFor(() => expect(scrollbar).toHaveAttribute("data-scrolling"));

      fireEvent.pointerUp(thumb, { pointerId: 1 });

      expect(releasePointerCapture).toHaveBeenCalled();
    });

    it("uses the negative RTL range and clears scrolling on pointer cancel", async () => {
      const { scrollbar, thumb, viewport } = await renderHorizontal("rtl");
      const rect = thumb.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      fireEvent.pointerDown(thumb, {
        button: 0,
        clientX: startX,
        clientY: startY,
        pointerId: 1,
      });
      // Dragging toward the inline start (leftward) moves into the negative RTL range.
      fireEvent.pointerMove(thumb, {
        clientX: startX - 20,
        clientY: startY,
        pointerId: 1,
        buttons: 1,
      });

      expect(viewport.scrollLeft).toBeLessThan(0);
      await waitFor(() => expect(scrollbar).toHaveAttribute("data-scrolling"));

      expect(() => fireEvent.pointerCancel(thumb, { pointerId: 1 })).not.toThrow();
      await waitFor(() => expect(scrollbar).not.toHaveAttribute("data-scrolling"));
    });

    it("ends a drag whose release was missed instead of scrolling on hover", async () => {
      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: "100%", height: "100%", "scroll-snap-type": "y mandatory" }}
          >
            <div style={{ width: "200px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            keepMounted
            style={{ width: "10px", height: "200px" }}
          >
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport");
      const thumb = screen.getByTestId("thumb");
      await waitFor(() => expect(thumb.offsetHeight).toBeGreaterThan(0));

      // The missed-release scenario means no capture is ever in effect.
      Object.defineProperties(thumb, {
        setPointerCapture: { configurable: true, value: () => {} },
        hasPointerCapture: { configurable: true, value: () => false },
      });

      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      expect(viewport.style.scrollSnapType).toBe("none");

      fireEvent.pointerMove(thumb, { clientY: 20, pointerId: 1, buttons: 1 });
      expect(viewport.scrollTop).toBeGreaterThan(0);
      const scrolled = viewport.scrollTop;

      // A different pointer hovering over the thumb must not end the active drag.
      fireEvent.pointerMove(thumb, { clientY: 60, pointerId: 2, buttons: 0 });
      expect(viewport.scrollTop).toBe(scrolled);
      expect(viewport.style.scrollSnapType).toBe("none");

      fireEvent.pointerMove(thumb, { clientY: 60, pointerId: 1, buttons: 1 });
      expect(viewport.scrollTop).toBeGreaterThan(scrolled);
      const continuedScroll = viewport.scrollTop;
      await waitFor(() => expect(thumb).toHaveAttribute("data-scrolling"));

      // The release never arrived (e.g. pointer capture was lost mid-drag), so the first
      // buttonless move must end the drag rather than scroll. It must clear the scrolling state
      // immediately like a real release, not leave it lingering until the scroll timeout fires.
      fireEvent.pointerMove(thumb, { clientY: 100, pointerId: 1, buttons: 0 });
      expect(viewport.scrollTop).toBe(continuedScroll);
      expect(viewport.style.scrollSnapType).toBe("y mandatory");
      await waitFor(() => expect(thumb).not.toHaveAttribute("data-scrolling"));

      fireEvent.pointerMove(thumb, { clientY: 140, pointerId: 1, buttons: 0 });
      expect(viewport.scrollTop).toBe(continuedScroll);
    });
  });
});
