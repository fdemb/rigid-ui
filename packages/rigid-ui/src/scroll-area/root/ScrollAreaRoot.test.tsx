import { createSignal } from "solid-js";
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
  withMockResizeObserver,
} from "../../../test/ScrollAreaFixture";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";

const SCROLLBAR_WIDTH = 10;
const SCROLLBAR_HEIGHT = 10;

describe("<ScrollArea.Root />", () => {
  it("forwards native props, class, style, and refs", () => {
    let rootRef: HTMLDivElement | undefined;

    render(() => (
      <ScrollArea.Root
        ref={(element) => (rootRef = element)}
        class="root-class"
        data-testid="root"
        aria-label="Messages"
        style={{ width: "123px" }}
      />
    ));

    const root = screen.getByTestId("root");
    expect(rootRef).toBe(root);
    expect(root).toHaveClass("root-class");
    expect(root).toHaveAttribute("aria-label", "Messages");
    expect(root).toHaveAttribute("role", "presentation");
    expect(root).toHaveStyle({ width: "123px" });
  });

  describe("data-scrolling attribute", () => {
    it("adds [data-scrolling] attribute when viewport is scrolled", async () => {
      vi.useFakeTimers();

      render(() => (
        <ScrollArea.Root data-testid="root" style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      ));

      const root = screen.getByTestId("root");
      const viewport = screen.getByTestId("viewport");

      expect(root).not.toHaveAttribute("data-scrolling");

      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollTop: 1 });
      await flushMicrotasks();

      expect(root).toHaveAttribute("data-scrolling", "");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT);

      expect(root).not.toHaveAttribute("data-scrolling");

      // Horizontal scrolling marks the root just the same.
      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollLeft: 1 });
      await flushMicrotasks();

      expect(root).toHaveAttribute("data-scrolling", "");

      await vi.advanceTimersByTimeAsync(SCROLL_TIMEOUT);

      expect(root).not.toHaveAttribute("data-scrolling");
    });
  });

  describe.skipIf(!isJSDOM)("hover state in JSDOM", () => {
    it("does not enter hover state for touch pointers", async () => {
      render(() => (
        <ScrollArea.Root data-testid="root">
          <ScrollArea.Viewport data-testid="viewport" />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted />
        </ScrollArea.Root>
      ));

      fireEvent.pointerEnter(screen.getByTestId("root"), { pointerType: "touch" });
      await flushMicrotasks();

      expect(screen.getByTestId("scrollbar")).not.toHaveAttribute("data-hovering");
    });

    it("enters hover state for mouse pointers and clears it on leave", async () => {
      render(() => (
        <ScrollArea.Root data-testid="root">
          <ScrollArea.Viewport data-testid="viewport" />
          <ScrollArea.Scrollbar data-testid="scrollbar" keepMounted />
        </ScrollArea.Root>
      ));

      const root = screen.getByTestId("root");
      const scrollbar = screen.getByTestId("scrollbar");

      fireEvent.pointerEnter(root, { pointerType: "mouse" });
      await flushMicrotasks();
      expect(scrollbar).toHaveAttribute("data-hovering", "");

      fireEvent.pointerLeave(root, { pointerType: "mouse" });
      await flushMicrotasks();
      expect(scrollbar).not.toHaveAttribute("data-hovering");
    });
  });

  describe.skipIf(!isJSDOM)("data-id stamping in JSDOM", () => {
    it("stamps matching data-id values on the viewport and scrollbars", () => {
      render(() => (
        <ScrollArea.Root data-testid="root">
          <ScrollArea.Viewport data-testid="viewport" />
          <ScrollArea.Scrollbar data-testid="scrollbar-y" keepMounted />
          <ScrollArea.Scrollbar data-testid="scrollbar-x" orientation="horizontal" keepMounted />
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport");
      const scrollbarY = screen.getByTestId("scrollbar-y");
      const scrollbarX = screen.getByTestId("scrollbar-x");

      expect(viewport).toHaveAttribute("data-id");
      expect(viewport.getAttribute("data-id")).toMatch(/-viewport$/);
      expect(scrollbarY.getAttribute("data-id")).toBe(
        `${viewport.getAttribute("data-id")!.replace(/-viewport$/, "")}-scrollbar`,
      );
      // Both orientations share the root id.
      expect(scrollbarX.getAttribute("data-id")).toBe(scrollbarY.getAttribute("data-id"));
    });

    it("generates distinct ids per scroll area instance", () => {
      render(() => (
        <div>
          <ScrollArea.Root>
            <ScrollArea.Viewport data-testid="viewport-1" />
            <ScrollArea.Scrollbar data-testid="scrollbar-1" keepMounted />
          </ScrollArea.Root>
          <ScrollArea.Root>
            <ScrollArea.Viewport data-testid="viewport-2" />
            <ScrollArea.Scrollbar data-testid="scrollbar-2" keepMounted />
          </ScrollArea.Root>
        </div>
      ));

      const id1 = screen.getByTestId("viewport-1").getAttribute("data-id");
      const id2 = screen.getByTestId("viewport-2").getAttribute("data-id");

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(screen.getByTestId("scrollbar-2").getAttribute("data-id")).toBe(
        id2!.replace(/-viewport$/, "-scrollbar"),
      );
    });

    it("lets an explicit data-id prop win over the generated one", () => {
      render(() => (
        <ScrollArea.Root>
          <ScrollArea.Viewport data-testid="viewport" data-id="custom-viewport" />
        </ScrollArea.Root>
      ));

      expect(screen.getByTestId("viewport")).toHaveAttribute("data-id", "custom-viewport");
    });
  });

  describe.skipIf(isJSDOM)("sizing", () => {
    it("recomputes thumb size when becoming visible without requiring scroll", async () => {
      const [visible, setVisible] = createSignal(false);

      render(() => (
        <div style={{ display: visible() ? "block" : "none" }}>
          <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
            <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
              <div
                style={{
                  width: `${SCROLLABLE_CONTENT_SIZE}px`,
                  height: `${SCROLLABLE_CONTENT_SIZE}px`,
                }}
              />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="vertical" style={{ display: "flex" }}>
              <ScrollArea.Thumb data-testid="vertical-thumb" style={{ "padding-block": "8px" }} />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </div>
      ));

      setVisible(true);

      const verticalThumb = await screen.findByTestId("vertical-thumb");

      await waitFor(() => {
        expect(
          getComputedStyle(verticalThumb).getPropertyValue("--scroll-area-thumb-height"),
        ).not.toBe("0px");
      });
    });

    it("shows scrollbars after mount compute before the first ResizeObserver measurement", async () => {
      await withMockResizeObserver(async (notifyResizeObserver) => {
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
            <ScrollArea.Scrollbar orientation="vertical" data-testid="vertical-scrollbar">
              <ScrollArea.Thumb data-testid="vertical-thumb" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        ));

        const verticalScrollbar = await screen.findByTestId("vertical-scrollbar");

        await waitFor(() => {
          expect(getComputedStyle(verticalScrollbar).visibility).toBe("visible");
        });

        notifyResizeObserver();
        await flushMicrotasks();

        await waitFor(() => {
          expect(getComputedStyle(verticalScrollbar).visibility).toBe("visible");
        });
      });
    });

    it("shows keepMounted scrollbar track and thumb after mount compute", async () => {
      await withMockResizeObserver(async (notifyResizeObserver) => {
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
            <ScrollArea.Scrollbar
              orientation="vertical"
              data-testid="vertical-scrollbar"
              keepMounted
            >
              <ScrollArea.Thumb data-testid="vertical-thumb" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        ));

        const verticalScrollbar = screen.getByTestId("vertical-scrollbar");
        const verticalThumb = screen.getByTestId("vertical-thumb");

        await waitFor(() => expect(getComputedStyle(verticalScrollbar).visibility).toBe("visible"));
        await waitFor(() => expect(getComputedStyle(verticalThumb).visibility).toBe("visible"));

        notifyResizeObserver();
        await flushMicrotasks();

        expect(getComputedStyle(verticalScrollbar).visibility).toBe("visible");
        expect(getComputedStyle(verticalThumb).visibility).toBe("visible");
      });
    });

    it("recomputes corner size when content starts overflowing", async () => {
      await withMockResizeObserver(async (notifyResizeObserver) => {
        const [contentSize, setContentSize] = createSignal(VIEWPORT_SIZE / 2);

        render(() => (
          <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
            <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
              <div style={{ width: `${contentSize()}px`, height: `${contentSize()}px` }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              data-testid="scrollbar-vertical"
              style={{ width: "11px" }}
            >
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
            <ScrollArea.Scrollbar
              orientation="horizontal"
              data-testid="scrollbar-horizontal"
              style={{ height: "13px" }}
            >
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
            <ScrollArea.Corner data-testid="corner" />
          </ScrollArea.Root>
        ));

        notifyResizeObserver();
        await flushMicrotasks();

        expect(screen.queryByTestId("corner")).toBe(null);

        setContentSize(SCROLLABLE_CONTENT_SIZE);
        await flushMicrotasks();
        notifyResizeObserver();

        await waitFor(() => expect(screen.getByTestId("corner").style.width).toBe("11px"));
        expect(screen.getByTestId("corner").style.height).toBe("13px");
      });
    });

    it("clears corner, overflow attributes, and metrics when content stops overflowing", async () => {
      await withMockResizeObserver(async (notifyResizeObserver) => {
        const [contentSize, setContentSize] = createSignal(SCROLLABLE_CONTENT_SIZE);

        render(() => (
          <ScrollArea.Root
            data-testid="root"
            style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
          >
            <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
              <div style={{ width: `${contentSize()}px`, height: `${contentSize()}px` }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              keepMounted
              style={{ width: `${SCROLLBAR_WIDTH}px` }}
            >
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
            <ScrollArea.Scrollbar
              orientation="horizontal"
              keepMounted
              style={{ height: `${SCROLLBAR_HEIGHT}px` }}
            >
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
            <ScrollArea.Corner data-testid="corner" />
          </ScrollArea.Root>
        ));

        const root = screen.getByTestId("root");
        const viewport = screen.getByTestId("viewport");

        await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-x"));
        await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-y"));
        expect(screen.getByTestId("corner")).toBeInTheDocument();
        expect(viewport.style.getPropertyValue("--scroll-area-overflow-x-end")).not.toBe("0px");
        expect(viewport.style.getPropertyValue("--scroll-area-overflow-y-end")).not.toBe("0px");

        setContentSize(VIEWPORT_SIZE / 2);
        await flushMicrotasks();
        notifyResizeObserver();

        await waitFor(() => expect(root).not.toHaveAttribute("data-has-overflow-x"));
        await waitFor(() => expect(root).not.toHaveAttribute("data-has-overflow-y"));
        expect(screen.queryByTestId("corner")).toBe(null);
        expect(viewport.style.getPropertyValue("--scroll-area-overflow-x-start")).toBe("0px");
        expect(viewport.style.getPropertyValue("--scroll-area-overflow-x-end")).toBe("0px");
        expect(viewport.style.getPropertyValue("--scroll-area-overflow-y-start")).toBe("0px");
        expect(viewport.style.getPropertyValue("--scroll-area-overflow-y-end")).toBe("0px");
      });
    });

    it("sets thumb height and width based on scrollable content", async () => {
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
          <ScrollArea.Scrollbar orientation="vertical">
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal">
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const expected = `${(VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE) * VIEWPORT_SIZE}px`;

      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId("vertical-thumb")).getPropertyValue(
            "--scroll-area-thumb-height",
          ),
        ).toBe(expected),
      );
      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId("horizontal-thumb")).getPropertyValue(
            "--scroll-area-thumb-width",
          ),
        ).toBe(expected),
      );
    });

    it("does not add padding for overlay scrollbars", async () => {
      render(() => (
        <ScrollArea.Root style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <ScrollArea.Content>
              <div
                style={{
                  width: `${SCROLLABLE_CONTENT_SIZE}px`,
                  height: `${SCROLLABLE_CONTENT_SIZE}px`,
                }}
              />
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            style={{ width: `${SCROLLBAR_WIDTH}px`, height: "100%" }}
          />
          <ScrollArea.Scrollbar
            orientation="horizontal"
            style={{ height: `${SCROLLBAR_HEIGHT}px`, width: "100%" }}
          />
        </ScrollArea.Root>
      ));

      const contentWrapper = screen.getByTestId("viewport").firstElementChild!;
      const style = getComputedStyle(contentWrapper);

      expect(style.paddingLeft).toBe("0px");
      expect(style.paddingRight).toBe("0px");
      expect(style.paddingBottom).toBe("0px");
    });

    it("accounts for scrollbar padding", async () => {
      const PADDING = 8;

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
          <ScrollArea.Scrollbar orientation="vertical" style={{ "padding-block": `${PADDING}px` }}>
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            orientation="horizontal"
            style={{ "padding-inline": `${PADDING}px` }}
          >
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const expected = `${(VIEWPORT_SIZE - PADDING * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`;

      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId("vertical-thumb")).getPropertyValue(
            "--scroll-area-thumb-height",
          ),
        ).toBe(expected),
      );
      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId("horizontal-thumb")).getPropertyValue(
            "--scroll-area-thumb-width",
          ),
        ).toBe(expected),
      );
    });

    it("accounts for scrollbar margin", async () => {
      const MARGIN = 11;
      const viewportSize = 390;

      render(() => (
        <ScrollArea.Root style={{ width: `${viewportSize}px`, height: `${viewportSize}px` }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div
              style={{
                width: `${SCROLLABLE_CONTENT_SIZE}px`,
                height: `${SCROLLABLE_CONTENT_SIZE}px`,
              }}
            />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" style={{ "margin-inline": `${MARGIN}px` }}>
            <ScrollArea.Thumb data-testid="vertical-thumb" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" style={{ "margin-block": `${MARGIN}px` }}>
            <ScrollArea.Thumb data-testid="horizontal-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const expected = `${viewportSize * (viewportSize / SCROLLABLE_CONTENT_SIZE)}px`;

      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId("vertical-thumb")).getPropertyValue(
            "--scroll-area-thumb-height",
          ),
        ).toBe(expected),
      );
      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId("horizontal-thumb")).getPropertyValue(
            "--scroll-area-thumb-width",
          ),
        ).toBe(expected),
      );
    });

    it("accounts for thumb margin", async () => {
      const MARGIN = 8;

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
          <ScrollArea.Scrollbar orientation="vertical">
            <ScrollArea.Thumb
              data-testid="vertical-thumb"
              style={{ "margin-block": `${MARGIN}px` }}
            />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal">
            <ScrollArea.Thumb
              data-testid="horizontal-thumb"
              style={{ "margin-inline": `${MARGIN}px` }}
            />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const expected = `${(VIEWPORT_SIZE - MARGIN * 2) * (VIEWPORT_SIZE / SCROLLABLE_CONTENT_SIZE)}px`;

      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId("vertical-thumb")).getPropertyValue(
            "--scroll-area-thumb-height",
          ),
        ).toBe(expected),
      );
      await waitFor(() =>
        expect(
          getComputedStyle(screen.getByTestId("horizontal-thumb")).getPropertyValue(
            "--scroll-area-thumb-width",
          ),
        ).toBe(expected),
      );
    });
  });

  describe.skipIf(isJSDOM)("overflow data attributes", () => {
    function renderOverflowArea(rootProps: Record<string, unknown> = {}) {
      render(() => (
        <ScrollArea.Root
          data-testid="root"
          {...rootProps}
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
        >
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <ScrollArea.Content data-testid="content">
              <div
                style={{
                  width: `${SCROLLABLE_CONTENT_SIZE}px`,
                  height: `${SCROLLABLE_CONTENT_SIZE}px`,
                }}
              />
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" data-testid="scrollbar-vertical">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar-horizontal">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));
    }

    it("measures content mounted after the viewport initial measurement", async () => {
      const [show, setShow] = createSignal(false);

      render(() => (
        <ScrollArea.Root
          data-testid="root"
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
        >
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            {show() ? (
              <ScrollArea.Content>
                <div
                  style={{
                    width: `${SCROLLABLE_CONTENT_SIZE}px`,
                    height: `${SCROLLABLE_CONTENT_SIZE}px`,
                  }}
                />
              </ScrollArea.Content>
            ) : null}
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const root = screen.getByTestId("root");
      const viewport = screen.getByTestId("viewport");

      // Empty viewport: no overflow and kept out of tab order.
      await waitFor(() => expect(root).not.toHaveAttribute("data-has-overflow-y"));
      expect(viewport).toHaveAttribute("tabindex", "-1");

      setShow(true);

      // Once oversized content mounts, overflow state and tab order must update.
      await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-x"));
      await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-y"));
      await waitFor(() => expect(viewport).toHaveAttribute("tabindex", "0"));
    });

    it("applies data attributes on root, viewport, content and scrollbars", async () => {
      renderOverflowArea();

      const root = screen.getByTestId("root");
      const viewport = screen.getByTestId("viewport");
      const content = screen.getByTestId("content");

      // Initial: parked at the start of both axes. The scrollbars only mount once overflow is
      // detected, so wait for that before reading them.
      await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-x"));
      await waitFor(() => expect(root).toHaveAttribute("data-overflow-x-end"));

      const vScrollbar = screen.getByTestId("scrollbar-vertical");
      const hScrollbar = screen.getByTestId("scrollbar-horizontal");

      for (const part of [root, viewport, content]) {
        expect(part).toHaveAttribute("data-has-overflow-x");
        expect(part).toHaveAttribute("data-has-overflow-y");
        expect(part).not.toHaveAttribute("data-overflow-x-start");
        expect(part).toHaveAttribute("data-overflow-x-end");
        expect(part).not.toHaveAttribute("data-overflow-y-start");
        expect(part).toHaveAttribute("data-overflow-y-end");
      }

      // A scrollbar only carries the axis it controls.
      expect(vScrollbar).toHaveAttribute("data-has-overflow-y");
      expect(vScrollbar).not.toHaveAttribute("data-has-overflow-x");
      expect(vScrollbar).not.toHaveAttribute("data-overflow-y-start");
      expect(vScrollbar).toHaveAttribute("data-overflow-y-end");
      expect(hScrollbar).toHaveAttribute("data-has-overflow-x");
      expect(hScrollbar).not.toHaveAttribute("data-has-overflow-y");
      expect(hScrollbar).not.toHaveAttribute("data-overflow-x-start");
      expect(hScrollbar).toHaveAttribute("data-overflow-x-end");

      // Scroll to the middle: both edges are past.
      viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
      fireEvent.scroll(viewport);
      await flushMicrotasks();

      for (const part of [root, viewport, content]) {
        expect(part).toHaveAttribute("data-overflow-y-start");
        expect(part).toHaveAttribute("data-overflow-y-end");
        expect(part).toHaveAttribute("data-overflow-x-start");
        expect(part).toHaveAttribute("data-overflow-x-end");
      }
      expect(vScrollbar).toHaveAttribute("data-overflow-y-start");
      expect(vScrollbar).toHaveAttribute("data-overflow-y-end");
      expect(hScrollbar).toHaveAttribute("data-overflow-x-start");
      expect(hScrollbar).toHaveAttribute("data-overflow-x-end");

      // Scroll to the end: the end edges clear.
      viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
      viewport.scrollLeft = viewport.scrollWidth - viewport.clientWidth;
      fireEvent.scroll(viewport);
      await flushMicrotasks();

      for (const part of [root, viewport, content]) {
        expect(part).toHaveAttribute("data-overflow-y-start");
        expect(part).not.toHaveAttribute("data-overflow-y-end");
        expect(part).toHaveAttribute("data-overflow-x-start");
        expect(part).not.toHaveAttribute("data-overflow-x-end");
      }
      expect(vScrollbar).toHaveAttribute("data-overflow-y-start");
      expect(vScrollbar).not.toHaveAttribute("data-overflow-y-end");
      expect(hScrollbar).toHaveAttribute("data-overflow-x-start");
      expect(hScrollbar).not.toHaveAttribute("data-overflow-x-end");
    });

    it("treats near-edge scroll offsets as fully scrolled", async () => {
      renderOverflowArea();

      const root = screen.getByTestId("root");
      const viewport = screen.getByTestId("viewport");
      await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-y"));

      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;

      // Subpixel layout leaves a fractional gap at the extremes; it must still read as an edge.
      Object.defineProperty(viewport, "scrollTop", {
        configurable: true,
        get: () => maxScrollTop - 0.5,
      });
      Object.defineProperty(viewport, "scrollLeft", {
        configurable: true,
        get: () => maxScrollLeft - 0.5,
      });
      fireEvent.scroll(viewport);
      await flushMicrotasks();

      expect(root).toHaveAttribute("data-overflow-y-start");
      expect(root).not.toHaveAttribute("data-overflow-y-end");
      expect(root).toHaveAttribute("data-overflow-x-start");
      expect(root).not.toHaveAttribute("data-overflow-x-end");
    });

    it("respects overflowEdgeThreshold and exposes scroll metrics", async () => {
      renderOverflowArea({ overflowEdgeThreshold: { xStart: 20, yStart: 5 } });

      const viewport = screen.getByTestId("viewport");
      await waitFor(() => expect(viewport).toHaveAttribute("data-has-overflow-x"));

      viewport.scrollLeft = 15;
      viewport.scrollTop = 7;
      fireEvent.scroll(viewport);

      await waitFor(() => expect(viewport).not.toHaveAttribute("data-overflow-x-start"));
      expect(viewport).toHaveAttribute("data-overflow-y-start");

      viewport.scrollLeft = 35;
      viewport.scrollTop = 7;
      fireEvent.scroll(viewport);

      await waitFor(() => expect(viewport).toHaveAttribute("data-overflow-x-start"));

      expect(viewport.style.getPropertyValue("--scroll-area-overflow-x-start")).toBe("35px");
      const horizontalEndPx = viewport.style.getPropertyValue("--scroll-area-overflow-x-end");
      expect(horizontalEndPx).not.toBe("");
      expect(horizontalEndPx).not.toBe("0px");
    });

    it("applies a numeric overflowEdgeThreshold to every edge", async () => {
      renderOverflowArea({ overflowEdgeThreshold: 20 });

      const viewport = screen.getByTestId("viewport");
      await waitFor(() => expect(viewport).toHaveAttribute("data-has-overflow-x"));

      viewport.scrollLeft = 15;
      viewport.scrollTop = 15;
      fireEvent.scroll(viewport);
      await flushMicrotasks();

      expect(viewport).not.toHaveAttribute("data-overflow-x-start");
      expect(viewport).not.toHaveAttribute("data-overflow-y-start");
      expect(viewport).toHaveAttribute("data-overflow-x-end");
      expect(viewport).toHaveAttribute("data-overflow-y-end");

      viewport.scrollLeft = viewport.scrollWidth - viewport.clientWidth - 15;
      viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight - 15;
      fireEvent.scroll(viewport);
      await flushMicrotasks();

      expect(viewport).toHaveAttribute("data-overflow-x-start");
      expect(viewport).toHaveAttribute("data-overflow-y-start");
      expect(viewport).not.toHaveAttribute("data-overflow-x-end");
      expect(viewport).not.toHaveAttribute("data-overflow-y-end");
    });

    it("recomputes overflow edges when overflowEdgeThreshold changes", async () => {
      const [yStart, setYStart] = createSignal(5);

      render(() => (
        <ScrollArea.Root
          data-testid="root"
          overflowEdgeThreshold={{ yStart: yStart() }}
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
        >
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <ScrollArea.Content>
              <div
                style={{
                  width: `${SCROLLABLE_CONTENT_SIZE}px`,
                  height: `${SCROLLABLE_CONTENT_SIZE}px`,
                }}
              />
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport");
      await waitFor(() => expect(viewport).toHaveAttribute("data-has-overflow-y"));

      viewport.scrollTop = 10;
      fireEvent.scroll(viewport);
      await waitFor(() => expect(viewport).toHaveAttribute("data-overflow-y-start"));

      // Raising the threshold above the current offset must clear the edge without a new scroll.
      setYStart(20);
      await waitFor(() => expect(viewport).not.toHaveAttribute("data-overflow-y-start"));
    });

    it("correctly handles RTL", async () => {
      render(() => (
        <DirectionProvider direction="rtl">
          <ScrollArea.Root
            data-testid="root"
            style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px`, direction: "rtl" }}
          >
            <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
              <div style={{ width: `${SCROLLABLE_CONTENT_SIZE}px`, height: "200px" }} />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="horizontal" data-testid="scrollbar-horizontal">
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </DirectionProvider>
      ));

      const root = screen.getByTestId("root");
      const viewport = screen.getByTestId("viewport");

      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      scrollViewport(viewport, { scrollLeft: 0 });
      await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-x"));
      expect(root).not.toHaveAttribute("data-overflow-x-start");
      expect(root).toHaveAttribute("data-overflow-x-end");

      scrollViewport(viewport, { scrollLeft: -maxScrollLeft / 2 });
      await waitFor(() => expect(root).toHaveAttribute("data-overflow-x-start"));
      expect(root).toHaveAttribute("data-overflow-x-end");

      scrollViewport(viewport, { scrollLeft: -maxScrollLeft });
      await waitFor(() => expect(root).not.toHaveAttribute("data-overflow-x-end"));
      expect(root).toHaveAttribute("data-overflow-x-start");
    });

    it("recomputes horizontal overflow edges when direction changes", async () => {
      // Solid's render has no `rerender`; a signal driving the provider is the same
      // reactive contract.
      const [direction, setDirection] = createSignal<"ltr" | "rtl">("ltr");

      render(() => (
        <DirectionProvider direction={direction()}>
          <ScrollArea.Root
            data-testid="root"
            style={{
              width: `${VIEWPORT_SIZE}px`,
              height: `${VIEWPORT_SIZE}px`,
              get direction() {
                return direction();
              },
            }}
          >
            <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
              <div
                style={{ width: `${SCROLLABLE_CONTENT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
              />
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="horizontal">
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </DirectionProvider>
      ));

      const root = screen.getByTestId("root");
      const viewport = screen.getByTestId("viewport");

      await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-x"));

      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      scrollViewport(viewport, { scrollLeft: maxScrollLeft / 2 });

      await waitFor(() => {
        expect(root).toHaveAttribute("data-overflow-x-start");
        expect(root).toHaveAttribute("data-overflow-x-end");
      });

      setDirection("rtl");

      await waitFor(() => expect(root.style.direction).toBe("rtl"));
      scrollViewport(viewport, { scrollLeft: -maxScrollLeft });

      await waitFor(() => {
        expect(root).toHaveAttribute("data-overflow-x-start");
        expect(root).not.toHaveAttribute("data-overflow-x-end");
      });
    });

    it("does not add state attributes when content does not overflow", async () => {
      render(() => (
        <ScrollArea.Root
          data-testid="root"
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
        >
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <ScrollArea.Content data-testid="content">
              <div style={{ width: `${VIEWPORT_SIZE / 2}px`, height: `${VIEWPORT_SIZE / 2}px` }} />
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" keepMounted data-testid="scrollbar-vertical">
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            orientation="horizontal"
            keepMounted
            data-testid="scrollbar-horizontal"
          >
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      await flushMicrotasks();
      await waitFor(() => expect(screen.getByTestId("viewport")).toHaveAttribute("tabindex", "-1"));

      for (const testId of ["root", "viewport", "content"]) {
        const part = screen.getByTestId(testId);
        expect(part).not.toHaveAttribute("data-has-overflow-x");
        expect(part).not.toHaveAttribute("data-has-overflow-y");
        expect(part).not.toHaveAttribute("data-overflow-x-start");
        expect(part).not.toHaveAttribute("data-overflow-x-end");
        expect(part).not.toHaveAttribute("data-overflow-y-start");
        expect(part).not.toHaveAttribute("data-overflow-y-end");
      }

      expect(screen.getByTestId("scrollbar-vertical")).not.toHaveAttribute("data-overflow-y-start");
      expect(screen.getByTestId("scrollbar-vertical")).not.toHaveAttribute("data-overflow-y-end");
      expect(screen.getByTestId("scrollbar-horizontal")).not.toHaveAttribute(
        "data-overflow-x-start",
      );
      expect(screen.getByTestId("scrollbar-horizontal")).not.toHaveAttribute("data-overflow-x-end");
    });
  });

  describe.skipIf(!isJSDOM)("overflow state in JSDOM", () => {
    it("marks only the scrollbar matching the scrolled axis", async () => {
      render(() => (
        <ScrollArea.Root data-testid="root">
          <ScrollArea.Viewport data-testid="viewport" />
          <ScrollArea.Scrollbar data-testid="scrollbar-y" keepMounted />
          <ScrollArea.Scrollbar data-testid="scrollbar-x" orientation="horizontal" keepMounted />
        </ScrollArea.Root>
      ));

      const viewport = screen.getByTestId("viewport");
      mockViewportMetrics(viewport);

      fireEvent.pointerEnter(viewport);
      scrollViewport(viewport, { scrollTop: 20, scrollLeft: 0 });
      await flushMicrotasks();

      expect(screen.getByTestId("scrollbar-y")).toHaveAttribute("data-scrolling");
      expect(screen.getByTestId("scrollbar-x")).not.toHaveAttribute("data-scrolling");
    });
  });
});
