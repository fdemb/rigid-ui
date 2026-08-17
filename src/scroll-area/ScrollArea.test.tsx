import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { ScrollArea } from "./index";
import { SCROLL_TIMEOUT } from "./constants";
import { ScrollAreaFixture } from "../../test/ScrollAreaFixture";
import { flushMicrotasks, isJSDOM, render } from "../../test/test-utils";

describe("ScrollArea", () => {
  describe("DOM contract", () => {
    it("forwards native props, class, style, and refs", async () => {
      let rootRef: HTMLDivElement | undefined;
      let viewportRef: HTMLDivElement | undefined;

      await render(() => (
        <ScrollArea.Root
          ref={(element) => (rootRef = element)}
          class="root-class"
          data-testid="root"
          aria-label="Messages"
          style={{ width: "123px" }}
        >
          <ScrollArea.Viewport
            ref={(element) => (viewportRef = element)}
            class="viewport-class"
            data-testid="viewport"
          />
        </ScrollArea.Root>
      ));

      const root = screen.getByTestId("root");
      const viewport = screen.getByTestId("viewport");
      expect(rootRef).toBe(root);
      expect(viewportRef).toBe(viewport);
      expect(root).toHaveClass("root-class");
      expect(root).toHaveAttribute("aria-label", "Messages");
      expect(root).toHaveStyle({ width: "123px" });
      expect(viewport).toHaveClass("viewport-class");
      expect(viewport).toHaveAttribute("role", "presentation");
    });

    it("defaults scrollbars to vertical and forwards orientation", async () => {
      await render(() => (
        <ScrollArea.Root>
          <ScrollArea.Scrollbar keepMounted data-testid="vertical" />
          <ScrollArea.Scrollbar keepMounted orientation="horizontal" data-testid="horizontal" />
        </ScrollArea.Root>
      ));

      expect(screen.getByTestId("vertical")).toHaveAttribute("data-orientation", "vertical");
      expect(screen.getByTestId("horizontal")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("forwards the scrollbar and thumb refs", async () => {
      let scrollbarRef: HTMLDivElement | undefined;
      let thumbRef: HTMLDivElement | undefined;
      await render(() => (
        <ScrollArea.Root>
          <ScrollArea.Scrollbar ref={(element) => (scrollbarRef = element)} keepMounted>
            <ScrollArea.Thumb ref={(element) => (thumbRef = element)} data-testid="thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      expect(scrollbarRef).toBeInstanceOf(HTMLDivElement);
      expect(thumbRef).toBe(screen.getByTestId("thumb"));
    });
  });

  describe.skipIf(!isJSDOM)("state in JSDOM", () => {
    it("marks the root and viewport while the user scrolls", async () => {
      vi.useFakeTimers();
      await render(() => <ScrollAreaFixture keepMounted />);
      const root = screen.getByTestId("root");
      const viewport = screen.getByTestId("viewport");
      Object.defineProperty(viewport, "scrollTop", {
        configurable: true,
        value: 20,
        writable: true,
      });

      fireEvent.wheel(viewport);
      fireEvent.scroll(viewport);
      await flushMicrotasks();

      expect(root).toHaveAttribute("data-scrolling");
      expect(viewport).toHaveAttribute("data-scrolling");
      vi.advanceTimersByTime(SCROLL_TIMEOUT);
      await flushMicrotasks();
      expect(root).not.toHaveAttribute("data-scrolling");
      expect(viewport).not.toHaveAttribute("data-scrolling");
    });

    it("marks only the scrollbar matching the scrolled axis", async () => {
      await render(() => <ScrollAreaFixture keepMounted />);
      const viewport = screen.getByTestId("viewport");
      Object.defineProperties(viewport, {
        scrollLeft: { configurable: true, value: 0, writable: true },
        scrollTop: { configurable: true, value: 20, writable: true },
      });

      fireEvent.wheel(viewport);
      fireEvent.scroll(viewport);
      await flushMicrotasks();

      expect(screen.getByTestId("scrollbar-y")).toHaveAttribute("data-scrolling");
      expect(screen.getByTestId("scrollbar-x")).not.toHaveAttribute("data-scrolling");
    });

    it("does not enter hover state for touch pointers", async () => {
      await render(() => <ScrollAreaFixture keepMounted />);
      const root = screen.getByTestId("root");
      fireEvent.pointerEnter(root, { pointerType: "touch" });
      await flushMicrotasks();
      expect(screen.getByTestId("scrollbar-y")).not.toHaveAttribute("data-hovering");
    });

    it("enters hover state for mouse pointers", async () => {
      await render(() => <ScrollAreaFixture keepMounted />);
      fireEvent.pointerEnter(screen.getByTestId("root"), { pointerType: "mouse" });
      await flushMicrotasks();
      expect(screen.getByTestId("scrollbar-y")).toHaveAttribute("data-hovering");
      expect(screen.getByTestId("scrollbar-x")).toHaveAttribute("data-hovering");
    });
  });

  describe.skipIf(isJSDOM)("layout in a browser", () => {
    it("detects overflow and sizes both thumbs", async () => {
      await render(() => <ScrollAreaFixture />);

      await waitFor(() => {
        expect(screen.getByTestId("root")).toHaveAttribute("data-has-overflow-x");
        expect(screen.getByTestId("root")).toHaveAttribute("data-has-overflow-y");
      });

      const vertical = screen.getByTestId("scrollbar-y");
      const horizontal = screen.getByTestId("scrollbar-x");
      expect(vertical).toBeVisible();
      expect(horizontal).toBeVisible();
      expect(screen.getByTestId("thumb-y").getBoundingClientRect().height).toBeGreaterThan(0);
      expect(screen.getByTestId("thumb-x").getBoundingClientRect().width).toBeGreaterThan(0);
    });

    it("moves thumbs and updates overflow edges when scrolled", async () => {
      await render(() => <ScrollAreaFixture />);
      const viewport = screen.getByTestId("viewport");
      await waitFor(() => expect(screen.getByTestId("thumb-y")).toBeVisible());

      viewport.scrollTop = 400;
      viewport.scrollLeft = 400;
      fireEvent.scroll(viewport);

      await waitFor(() => {
        expect(screen.getByTestId("thumb-y").style.transform).not.toBe("translate3d(0,0px,0)");
        expect(screen.getByTestId("thumb-x").style.transform).not.toBe("translate3d(0px,0,0)");
        expect(screen.getByTestId("root")).toHaveAttribute("data-overflow-x-start");
        expect(screen.getByTestId("root")).toHaveAttribute("data-overflow-y-start");
      });
    });

    it("applies the configured overflow edge threshold", async () => {
      await render(() => <ScrollAreaFixture rootProps={{ overflowEdgeThreshold: 50 }} />);
      const viewport = screen.getByTestId("viewport");
      await waitFor(() =>
        expect(screen.getByTestId("root")).toHaveAttribute("data-has-overflow-y"),
      );

      viewport.scrollTop = 40;
      fireEvent.scroll(viewport);
      expect(screen.getByTestId("root")).not.toHaveAttribute("data-overflow-y-start");

      viewport.scrollTop = 60;
      fireEvent.scroll(viewport);
      await waitFor(() =>
        expect(screen.getByTestId("root")).toHaveAttribute("data-overflow-y-start"),
      );
    });

    it("clears overflow state after content stops overflowing", async () => {
      let content: HTMLDivElement | undefined;
      await render(() => (
        <ScrollArea.Root data-testid="root" style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport">
            <ScrollArea.Content
              ref={(element) => (content = element)}
              style={{ width: "1000px", height: "1000px" }}
            />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar style={{ width: "10px" }}>
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      ));

      await waitFor(() =>
        expect(screen.getByTestId("root")).toHaveAttribute("data-has-overflow-y"),
      );
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      content!.style.width = "100px";
      content!.style.height = "100px";

      await waitFor(() =>
        expect(screen.getByTestId("root")).not.toHaveAttribute("data-has-overflow-y"),
      );
    });
  });
});
