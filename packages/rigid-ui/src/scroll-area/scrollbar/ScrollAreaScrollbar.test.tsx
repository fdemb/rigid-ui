import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { DirectionProvider } from "../../direction-provider/DirectionProvider";
import { ScrollArea } from "../index";
import { SCROLL_TIMEOUT } from "../constants";
import {
  SCROLLABLE_CONTENT_SIZE,
  VIEWPORT_SIZE,
  mockViewportMetrics,
  scrollViewport,
} from "../../../test/ScrollAreaFixture";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";

/** JSDOM computes no layout, so the track/thumb geometry the press math reads has to be pinned. */
function mockTrackGeometry(
  scrollbar: HTMLElement,
  thumb: HTMLElement,
  options: { axis?: "y" | "x"; trackSize?: number; thumbSize?: number } = {},
) {
  const { axis = "y", trackSize = 200, thumbSize = 40 } = options;
  const trackProp = axis === "y" ? "offsetHeight" : "offsetWidth";
  const thumbProp = axis === "y" ? "offsetHeight" : "offsetWidth";

  Object.defineProperties(scrollbar, {
    [trackProp]: { configurable: true, value: trackSize },
    getBoundingClientRect: { configurable: true, value: () => ({ top: 0, left: 0 }) },
  });
  Object.defineProperties(thumb, {
    [thumbProp]: { configurable: true, value: thumbSize },
    setPointerCapture: { configurable: true, value: () => {} },
    hasPointerCapture: { configurable: true, value: () => false },
  });
}

describe("<ScrollArea.Scrollbar />", () => {
  it("defaults to vertical, forwards orientation, and forwards the ref", () => {
    let scrollbarRef: HTMLDivElement | undefined;

    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Scrollbar
          ref={(element) => (scrollbarRef = element)}
          keepMounted
          data-testid="vertical"
        />
        <ScrollArea.Scrollbar keepMounted orientation="horizontal" data-testid="horizontal" />
      </ScrollArea.Root>
    ));

    expect(scrollbarRef).toBe(screen.getByTestId("vertical"));
    expect(screen.getByTestId("vertical")).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByTestId("horizontal")).toHaveAttribute("data-orientation", "horizontal");
  });

  describe("data-scrolling attribute", () => {
    it("adds [data-scrolling] on the scrollbar matching the scrolled axis", async () => {
      vi.useFakeTimers();

      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted />
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal" keepMounted />
          <ScrollArea.Corner />
        </ScrollArea.Root>
      ));

      const verticalScrollbar = screen.getByTestId("vertical");
      const horizontalScrollbar = screen.getByTestId("horizontal");
      const viewport = screen.getByTestId("viewport");

      expect(verticalScrollbar).not.toHaveAttribute("data-scrolling");
      expect(horizontalScrollbar).not.toHaveAttribute("data-scrolling");

      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollTop: 1 });
      await flushMicrotasks();

      expect(verticalScrollbar).toHaveAttribute("data-scrolling", "");
      expect(horizontalScrollbar).not.toHaveAttribute("data-scrolling");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT - 1);

      expect(verticalScrollbar).toHaveAttribute("data-scrolling", "");
      expect(horizontalScrollbar).not.toHaveAttribute("data-scrolling");

      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollLeft: 1 });

      // The vertical timer has just elapsed; the horizontal one has only started.
      await vi.advanceTimersByTimeAsync(1);

      expect(verticalScrollbar).not.toHaveAttribute("data-scrolling");
      expect(horizontalScrollbar).toHaveAttribute("data-scrolling");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT - 2);

      expect(verticalScrollbar).not.toHaveAttribute("data-scrolling");
      expect(horizontalScrollbar).toHaveAttribute("data-scrolling");

      await vi.advanceTimersByTimeAsync(1);

      expect(verticalScrollbar).not.toHaveAttribute("data-scrolling");
      expect(horizontalScrollbar).not.toHaveAttribute("data-scrolling");
    });
  });

  describe("data-hovering attribute", () => {
    it("detects a viewport that is already hovered on mount", async () => {
      // The viewport syncs `:hover` during mount, before a pointer event could establish it, so
      // the prototype has to be stubbed rather than the element. Nothing else in this test calls
      // `matches`, and the global `afterEach` restores it.
      vi.spyOn(Element.prototype, "matches").mockImplementation(function matches(
        this: Element,
        selector: string,
      ) {
        return selector === ":hover" && (this as HTMLElement).dataset.testid === "viewport";
      });

      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport data-testid="viewport" />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted />
        </ScrollArea.Root>
      ));

      await waitFor(() => expect(screen.getByTestId("scrollbar")).toHaveAttribute("data-hovering"));
    });

    it("does not enter hover state for touch pointers", async () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport data-testid="viewport" />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted />
        </ScrollArea.Root>
      ));

      fireEvent.pointerEnter(screen.getByTestId("viewport"), { pointerType: "touch" });
      await flushMicrotasks();

      expect(screen.getByTestId("scrollbar")).not.toHaveAttribute("data-hovering");
    });
  });

  describe("track pointer down", () => {
    it("ignores non-primary pointer presses", async () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ "scroll-snap-type": "y mandatory" }}
          />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport");
      mockTrackGeometry(screen.getByTestId("scrollbar"), screen.getByTestId("thumb"));
      mockViewportMetrics(viewport);

      fireEvent.pointerDown(screen.getByTestId("scrollbar"), {
        button: 2,
        clientY: 100,
        pointerId: 1,
      });

      expect(viewport.scrollTop).toBe(0);
      expect(viewport.style.scrollSnapType).toBe("y mandatory");
    });

    it("handles a track press when no viewport is mounted", async () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const scrollbar = screen.getByTestId("scrollbar");
      mockTrackGeometry(scrollbar, screen.getByTestId("thumb"));

      expect(() =>
        fireEvent.pointerDown(scrollbar, { button: 0, clientY: 100, pointerId: 1 }),
      ).not.toThrow();
      await flushMicrotasks();

      expect(scrollbar).not.toHaveAttribute("data-scrolling");
    });

    it("does not start a track gesture without a thumb", async () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ "scroll-snap-type": "y mandatory" }}
          />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted />
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport");
      mockViewportMetrics(viewport);

      fireEvent.pointerDown(screen.getByTestId("scrollbar"), {
        button: 0,
        clientY: 100,
        pointerId: 1,
      });

      expect(viewport.scrollTop).toBe(0);
      expect(viewport.style.scrollSnapType).toBe("y mandatory");
    });

    it("ignores thumb presses reported through the composed path", async () => {
      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      const verticalScrollbar = screen.getByTestId("vertical");
      const thumb = screen.getByTestId("thumb");

      mockViewportMetrics(viewport, { scrollWidth: VIEWPORT_SIZE });
      Object.defineProperty(viewport, "scrollTop", {
        configurable: true,
        writable: true,
        value: 0,
      });
      mockTrackGeometry(verticalScrollbar, thumb);

      const event = new MouseEvent("pointerdown", { bubbles: true, button: 0, clientY: 160 });
      // The press really landed on the thumb; `event.target` is the track host across a shadow
      // boundary, so only `composedPath()` reveals it.
      Object.defineProperty(event, "composedPath", {
        configurable: true,
        value: () => [thumb, verticalScrollbar],
      });

      fireEvent(verticalScrollbar, event);

      expect(viewport.scrollTop).toBe(0);
    });

    it("marks the scroll area as scrolling when pressing the track", async () => {
      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      const verticalScrollbar = screen.getByTestId("vertical");

      mockViewportMetrics(viewport, { scrollWidth: VIEWPORT_SIZE });
      Object.defineProperty(viewport, "scrollTop", {
        configurable: true,
        writable: true,
        value: 0,
      });
      mockTrackGeometry(verticalScrollbar, screen.getByTestId("thumb"));

      fireEvent.pointerDown(verticalScrollbar, { button: 0, clientY: 160, pointerId: 1 });

      expect(viewport.scrollTop).not.toBe(0);
      await waitFor(() => expect(verticalScrollbar).toHaveAttribute("data-scrolling"));
    });

    it("clears track drag state on pointer cancel", async () => {
      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      const verticalScrollbar = screen.getByTestId("vertical");
      const thumb = screen.getByTestId("thumb");

      mockViewportMetrics(viewport, { scrollWidth: VIEWPORT_SIZE });
      Object.defineProperty(viewport, "scrollTop", {
        configurable: true,
        writable: true,
        value: 0,
      });
      mockTrackGeometry(verticalScrollbar, thumb);

      fireEvent.pointerDown(verticalScrollbar, { button: 0, clientY: 160, pointerId: 1 });
      const scrollTopAfterTrackPress = viewport.scrollTop;

      fireEvent.pointerCancel(verticalScrollbar, { pointerId: 1 });
      fireEvent.pointerMove(thumb, { clientY: 180, pointerId: 1, buttons: 1 });

      expect(viewport.scrollTop).toBe(scrollTopAfterTrackPress);
    });
  });

  // JSDOM doesn't implement the focus side of a mouse press, so these assert the cancellation that
  // suppresses it rather than the resulting `activeElement`.
  describe("track mouse down", () => {
    function renderScrollbarWithThumb() {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport data-testid="viewport" />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));
    }

    // Native scrollbars keep focus for every button, not just the primary one.
    it.each([
      { name: "primary", button: 0 },
      { name: "middle", button: 1 },
      { name: "secondary", button: 2 },
    ])("cancels a $name press on the track so focus stays put", async ({ button }) => {
      renderScrollbarWithThumb();

      const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true, button });
      screen.getByTestId("scrollbar").dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it("cancels the press on the thumb so focus stays put", async () => {
      renderScrollbarWithThumb();

      const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 });
      screen.getByTestId("thumb").dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe("wheel", () => {
    function renderWheelTest(
      props: {
        direction?: "ltr" | "rtl";
        orientation?: "horizontal" | "vertical";
        scrollLeft?: number;
        scrollTop?: number;
      } = {},
    ) {
      const {
        direction = "ltr",
        orientation = "horizontal",
        scrollLeft = 0,
        scrollTop = 0,
      } = props;

      render(() => (
        <DirectionProvider direction={direction}>
          <ScrollArea.Root style={{ width: "200px", height: "200px", direction }}>
            <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
              <div style={{ width: "1000px", height: "1000px" }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation={orientation} data-testid="scrollbar" keepMounted />
          </ScrollArea.Root>
        </DirectionProvider>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      mockViewportMetrics(viewport);
      Object.defineProperties(viewport, {
        scrollLeft: { configurable: true, writable: true, value: scrollLeft },
        scrollTop: { configurable: true, writable: true, value: scrollTop },
      });

      return { viewport, scrollbar: screen.getByTestId("scrollbar") };
    }

    it("clamps horizontal wheel scrolling at both edges", async () => {
      const { viewport, scrollbar } = renderWheelTest();

      fireEvent.wheel(scrollbar, { deltaX: -50 });
      expect(viewport.scrollLeft).toBe(0);

      viewport.scrollLeft = 790;
      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(800);

      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(800);
    });

    it("allows horizontal scrolling away from the RTL start edge", async () => {
      const { viewport, scrollbar } = renderWheelTest({ direction: "rtl" });

      fireEvent.wheel(scrollbar, { deltaX: -50 });

      expect(viewport.scrollLeft).toBe(-50);
    });

    it("clamps horizontal RTL wheel scrolling at both edges", async () => {
      const { viewport, scrollbar } = renderWheelTest({ direction: "rtl" });

      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(0);

      viewport.scrollLeft = -100;
      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(-50);

      viewport.scrollLeft = -790;
      fireEvent.wheel(scrollbar, { deltaX: -50 });
      expect(viewport.scrollLeft).toBe(-800);

      fireEvent.wheel(scrollbar, { deltaX: -50 });
      expect(viewport.scrollLeft).toBe(-800);

      viewport.scrollLeft = -10;
      fireEvent.wheel(scrollbar, { deltaX: 50 });
      expect(viewport.scrollLeft).toBe(0);
    });

    it("clamps vertical wheel scrolling at both edges", async () => {
      const { viewport, scrollbar } = renderWheelTest({ orientation: "vertical" });

      fireEvent.wheel(scrollbar, { deltaY: -50 });
      expect(viewport.scrollTop).toBe(0);

      viewport.scrollTop = 790;
      fireEvent.wheel(scrollbar, { deltaY: 50 });
      expect(viewport.scrollTop).toBe(800);

      fireEvent.wheel(scrollbar, { deltaY: 50 });
      expect(viewport.scrollTop).toBe(800);
    });

    it("preventDefaults only when it consumes the scroll, allowing chaining at edges", async () => {
      const { viewport, scrollbar } = renderWheelTest({ orientation: "vertical" });

      // Mid-range: the wheel scroll is consumed, so the event is cancelled. `fireEvent` returns
      // the `dispatchEvent` result: `false` when `preventDefault` was called.
      viewport.scrollTop = 400;
      expect(fireEvent.wheel(scrollbar, { deltaY: 50 })).toBe(false);

      // At the end edge scrolling further: not consumed, so the event chains to the parent/page.
      viewport.scrollTop = 800;
      expect(fireEvent.wheel(scrollbar, { deltaY: 50 })).toBe(true);

      // At the start edge scrolling further backward, the event chains too.
      viewport.scrollTop = 0;
      expect(fireEvent.wheel(scrollbar, { deltaY: -50 })).toBe(true);
    });

    it("ignores zero-delta wheel events", async () => {
      const { viewport, scrollbar } = renderWheelTest({ orientation: "vertical", scrollTop: 400 });

      expect(fireEvent.wheel(scrollbar, { deltaY: 0 })).toBe(true);
      await flushMicrotasks();

      expect(viewport.scrollTop).toBe(400);
      expect(scrollbar).not.toHaveAttribute("data-scrolling");
    });

    it("does not intercept browser zoom gestures", async () => {
      const { viewport, scrollbar } = renderWheelTest({ orientation: "vertical", scrollTop: 400 });

      expect(fireEvent.wheel(scrollbar, { ctrlKey: true, deltaY: 50 })).toBe(true);
      await flushMicrotasks();

      expect(viewport.scrollTop).toBe(400);
      expect(scrollbar).not.toHaveAttribute("data-scrolling");
    });

    it("marks the scroll area as scrolling when wheeling over the vertical scrollbar", async () => {
      const { scrollbar } = renderWheelTest({ orientation: "vertical" });

      fireEvent.wheel(scrollbar, { deltaY: 50 });

      await waitFor(() => expect(scrollbar).toHaveAttribute("data-scrolling"));
    });

    it("marks the scroll area as scrolling when wheeling over the horizontal scrollbar", async () => {
      const { scrollbar } = renderWheelTest({ orientation: "horizontal" });

      fireEvent.wheel(scrollbar, { deltaX: 50 });

      await waitFor(() => expect(scrollbar).toHaveAttribute("data-scrolling"));
    });

    it("does not mark the scroll area as scrolling when chaining at an edge", async () => {
      const { viewport, scrollbar } = renderWheelTest({ orientation: "vertical" });

      // At the end edge scrolling further chains to the page without consuming the scroll, so the
      // area must not be marked as scrolling.
      viewport.scrollTop = 800;
      fireEvent.wheel(scrollbar, { deltaY: 50 });
      await flushMicrotasks();

      expect(scrollbar).not.toHaveAttribute("data-scrolling");
    });

    it.skipIf(isJSDOM)("registers after the scrollbar becomes visible", async () => {
      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "200px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="horizontal">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      const horizontalScrollbar = await screen.findByTestId("horizontal");

      await waitFor(() => expect(horizontalScrollbar).toHaveAttribute("data-has-overflow-x"));

      fireEvent.wheel(horizontalScrollbar, { deltaX: 50 });

      expect(viewport.scrollLeft).toBe(50);
    });
  });

  // The vertical and horizontal track-click branches share one axis-parameterized path.
  // `getOffset` reads logical margins and paddings that JSDOM doesn't compute, so exercise the
  // merged branch against real layout here.
  describe.skipIf(isJSDOM)("track click by axis", () => {
    async function renderAxisTrack(
      orientation: "horizontal" | "vertical",
      direction: "ltr" | "rtl" = "ltr",
    ) {
      render(() => (
        <DirectionProvider direction={direction}>
          <ScrollArea.Root style={{ width: "200px", height: "200px", direction }}>
            <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
              <div style={{ width: "1000px", height: "1000px" }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation={orientation} data-testid="scrollbar" keepMounted>
              <ScrollArea.Thumb data-testid="thumb" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </DirectionProvider>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      const scrollbar = screen.getByTestId("scrollbar");
      const thumb = screen.getByTestId("thumb");
      await waitFor(() => expect(thumb.offsetWidth + thumb.offsetHeight).toBeGreaterThan(0));

      return { viewport, scrollbar };
    }

    it("scrolls down when clicking below the thumb on a vertical track", async () => {
      const { viewport, scrollbar } = await renderAxisTrack("vertical");
      const rect = scrollbar.getBoundingClientRect();

      fireEvent.pointerDown(scrollbar, {
        button: 0,
        clientX: rect.left + rect.width / 2,
        clientY: rect.bottom - 5,
        pointerId: 1,
      });

      expect(viewport.scrollTop).toBeGreaterThan(0);
    });

    it("scrolls right when clicking the end of a horizontal track", async () => {
      const { viewport, scrollbar } = await renderAxisTrack("horizontal");
      const rect = scrollbar.getBoundingClientRect();

      fireEvent.pointerDown(scrollbar, {
        button: 0,
        clientX: rect.right - 5,
        clientY: rect.top + rect.height / 2,
        pointerId: 1,
      });

      expect(viewport.scrollLeft).toBeGreaterThan(0);
    });

    it("scrolls into the negative RTL range when clicking a horizontal RTL track", async () => {
      const { viewport, scrollbar } = await renderAxisTrack("horizontal", "rtl");
      const rect = scrollbar.getBoundingClientRect();

      fireEvent.pointerDown(scrollbar, {
        button: 0,
        clientX: rect.left + 5,
        clientY: rect.top + rect.height / 2,
        pointerId: 1,
      });

      expect(viewport.scrollLeft).toBeLessThan(0);
    });
  });

  // The jump-to-click assignment must run with snapping already disabled, or the assigned position
  // quantizes to the nearest snap point and the thumb stays offset from the pointer for the whole
  // drag. Requires real layout for the track/thumb offset math.
  describe.skipIf(isJSDOM)("scroll snap on track press", () => {
    it("does not snap the initial jump-to-click position", async () => {
      render(() => (
        <ScrollArea.Root style={{ width: "400px", height: "200px" }}>
          <ScrollArea.Viewport
            data-testid="viewport"
            style={{ width: "100%", height: "100%", "scroll-snap-type": "x mandatory" }}
          >
            <div style={{ display: "flex" }}>
              {Array.from({ length: 10 }, () => (
                <div
                  style={{
                    "flex-shrink": 0,
                    width: "200px",
                    height: "100px",
                    "scroll-snap-align": "start",
                  }}
                />
              ))}
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar" keepMounted>
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      const scrollbar = screen.getByTestId("scrollbar");
      const thumb = screen.getByTestId("thumb");
      await waitFor(() => expect(thumb.offsetWidth).toBeGreaterThan(0));

      // Aim mid-way between the 800 and 1000 snap points (200px items).
      const targetScroll = 900;
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const maxThumbOffset = scrollbar.offsetWidth - thumb.offsetWidth;
      const rect = scrollbar.getBoundingClientRect();
      const clickX =
        rect.left + (targetScroll / maxScroll) * maxThumbOffset + thumb.offsetWidth / 2;

      fireEvent.pointerDown(scrollbar, {
        button: 0,
        clientX: clickX,
        clientY: rect.top + rect.height / 2,
        pointerId: 1,
      });

      expect(Math.abs(viewport.scrollLeft - targetScroll)).toBeLessThanOrEqual(1);

      // Releasing restores snapping, which re-snaps to the nearest snap point.
      fireEvent.pointerUp(scrollbar, { pointerId: 1 });
      await waitFor(() => expect(viewport.scrollLeft % 200).toBe(0));
    });
  });

  // A short or heavily padded track drives `maxThumbOffset` to zero or negative once the thumb
  // hits its `MIN_THUMB_SIZE` floor. Dividing by a non-positive offset teleports the scroll
  // position to an extreme instead of moving proportionally. A 16px track ties the floored thumb
  // to the track length (offset 0); a 10px track is shorter than the floored thumb.
  describe.skipIf(isJSDOM)("non-positive thumb offset", () => {
    async function renderShortTrack(trackHeight: number) {
      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            data-testid="vertical"
            keepMounted
            style={{ height: `${trackHeight}px`, bottom: "auto", width: "12px" }}
          >
            <ScrollArea.Thumb data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport") as HTMLDivElement;
      const thumb = screen.getByTestId("thumb");
      await waitFor(() => expect(thumb.offsetHeight).toBeGreaterThan(0));

      return { viewport, verticalScrollbar: screen.getByTestId("vertical"), thumb };
    }

    it("does not jump the scroll when dragging a thumb that fills the track", async () => {
      const { viewport, thumb } = await renderShortTrack(16);

      // Park the scroll mid-range so an erroneous jump to an edge is detectable.
      viewport.scrollTop = 400;
      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(thumb, { clientY: 5, pointerId: 1, buttons: 1 });

      expect(viewport.scrollTop).toBe(400);
    });

    it("does not jump the scroll when dragging a thumb taller than the track", async () => {
      const { viewport, thumb } = await renderShortTrack(10);

      viewport.scrollTop = 400;
      fireEvent.pointerDown(thumb, { button: 0, clientY: 0, pointerId: 1 });
      fireEvent.pointerMove(thumb, { clientY: 5, pointerId: 1, buttons: 1 });

      expect(viewport.scrollTop).toBe(400);
    });

    it("does not jump the scroll when clicking a track whose thumb fills it", async () => {
      const { viewport, verticalScrollbar } = await renderShortTrack(16);

      viewport.scrollTop = 400;
      fireEvent.pointerDown(verticalScrollbar, { button: 0, clientY: 5, pointerId: 1 });

      expect(viewport.scrollTop).toBe(400);
    });

    it("does not jump the scroll when clicking a track whose thumb is taller than it", async () => {
      const { viewport, verticalScrollbar } = await renderShortTrack(10);

      viewport.scrollTop = 400;
      fireEvent.pointerDown(verticalScrollbar, { button: 0, clientY: 5, pointerId: 1 });

      expect(viewport.scrollTop).toBe(400);
    });
  });

  describe.skipIf(isJSDOM)("overflow data attributes", () => {
    it("applies data attributes on vertical and horizontal scrollbars", async () => {
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
          <ScrollArea.Scrollbar orientation="vertical" data-testid="scrollbar-vertical">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar-horizontal">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport");
      const vScrollbar = await screen.findByTestId("scrollbar-vertical");
      const hScrollbar = await screen.findByTestId("scrollbar-horizontal");

      await waitFor(() => expect(vScrollbar).toHaveAttribute("data-has-overflow-y"));
      expect(vScrollbar).not.toHaveAttribute("data-overflow-y-start");
      expect(vScrollbar).toHaveAttribute("data-overflow-y-end");
      expect(hScrollbar).toHaveAttribute("data-has-overflow-x");
      expect(hScrollbar).not.toHaveAttribute("data-overflow-x-start");
      expect(hScrollbar).toHaveAttribute("data-overflow-x-end");

      viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
      fireEvent.scroll(viewport);
      await flushMicrotasks();

      expect(vScrollbar).toHaveAttribute("data-overflow-y-start");
      expect(vScrollbar).toHaveAttribute("data-overflow-y-end");
      expect(hScrollbar).toHaveAttribute("data-overflow-x-start");
      expect(hScrollbar).toHaveAttribute("data-overflow-x-end");
    });
  });
});
