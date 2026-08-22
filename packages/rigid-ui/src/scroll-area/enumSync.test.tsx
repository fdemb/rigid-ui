import { screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { ScrollArea } from "./index";
import { ScrollAreaRootCssVars } from "./root/ScrollAreaRootCssVars";
import { ScrollAreaRootDataAttributes } from "./root/ScrollAreaRootDataAttributes";
import { ScrollAreaContentDataAttributes } from "./content/ScrollAreaContentDataAttributes";
import { ScrollAreaViewportDataAttributes } from "./viewport/ScrollAreaViewportDataAttributes";
import { ScrollAreaScrollbarCssVars } from "./scrollbar/ScrollAreaScrollbarCssVars";
import { ScrollAreaScrollbarDataAttributes } from "./scrollbar/ScrollAreaScrollbarDataAttributes";
import { ScrollAreaThumbDataAttributes } from "./thumb/ScrollAreaThumbDataAttributes";
import { ScrollAreaViewportCssVars } from "./viewport/ScrollAreaViewportCssVars";
import { overflowStateAttributes, scrollbarOverflowStateAttributes } from "./root/stateAttributes";
import { SCROLLABLE_CONTENT_SIZE, VIEWPORT_SIZE } from "../../test/ScrollAreaFixture";
import { isJSDOM, render } from "../../test/test-utils";

// The enums are the single source of truth for the public attribute and custom-property names,
// and what the generated documentation would be built from. These tests re-link every member to
// what the parts actually render, so a rename on only one side fails CI.
describe("ScrollArea enum sync", () => {
  it("keeps the per-part overflow attribute enums identical to the root's", () => {
    expect(ScrollAreaContentDataAttributes).toBe(ScrollAreaRootDataAttributes);
    expect(ScrollAreaViewportDataAttributes).toBe(ScrollAreaRootDataAttributes);

    for (const key of ["scrolling", "hasOverflowX", "hasOverflowY"] as const) {
      expect(ScrollAreaScrollbarDataAttributes[key]).toBe(ScrollAreaRootDataAttributes[key]);
    }
    expect(ScrollAreaThumbDataAttributes.scrolling).toBe(ScrollAreaRootDataAttributes.scrolling);
    expect(ScrollAreaThumbDataAttributes.orientation).toBe(
      ScrollAreaScrollbarDataAttributes.orientation,
    );
  });

  it("names every overflow attribute the shared serializer emits per the enums", () => {
    const emitted = Object.keys(
      overflowStateAttributes({
        scrollingX: () => true,
        scrollingY: () => false,
        hiddenState: () => ({ x: false, y: false, corner: false }),
        overflowEdges: () => ({ xStart: true, xEnd: true, yStart: true, yEnd: true }),
      } as never),
    );

    expect(emitted).toEqual([
      ScrollAreaRootDataAttributes.scrolling,
      ScrollAreaRootDataAttributes.hasOverflowX,
      ScrollAreaRootDataAttributes.hasOverflowY,
      ScrollAreaRootDataAttributes.overflowXStart,
      ScrollAreaRootDataAttributes.overflowXEnd,
      ScrollAreaRootDataAttributes.overflowYStart,
      ScrollAreaRootDataAttributes.overflowYEnd,
    ]);
  });

  it("names the per-axis scrollbar attributes per the enums", () => {
    const ctx = {
      hiddenState: () => ({ x: false, y: false, corner: false }),
      overflowEdges: () => ({ xStart: true, xEnd: true, yStart: true, yEnd: true }),
    } as never;

    expect(Object.keys(scrollbarOverflowStateAttributes(ctx, "vertical"))).toEqual([
      ScrollAreaScrollbarDataAttributes.hasOverflowY,
      ScrollAreaScrollbarDataAttributes.overflowYStart,
      ScrollAreaScrollbarDataAttributes.overflowYEnd,
    ]);
    expect(Object.keys(scrollbarOverflowStateAttributes(ctx, "horizontal"))).toEqual([
      ScrollAreaScrollbarDataAttributes.hasOverflowX,
      ScrollAreaScrollbarDataAttributes.overflowXStart,
      ScrollAreaScrollbarDataAttributes.overflowXEnd,
    ]);
  });

  it("names the orientation attributes per the scrollbar and thumb enums", () => {
    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Scrollbar orientation="horizontal" keepMounted data-testid="scrollbar">
          <ScrollArea.Thumb data-testid="thumb" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    ));

    expect(screen.getByTestId("scrollbar")).toHaveAttribute(
      ScrollAreaScrollbarDataAttributes.orientation,
      "horizontal",
    );
    expect(screen.getByTestId("thumb")).toHaveAttribute(
      ScrollAreaThumbDataAttributes.orientation,
      "horizontal",
    );
  });

  it("names the corner and thumb CSS variables per the *CssVars enums", () => {
    render(() => (
      <ScrollArea.Root data-testid="root">
        <ScrollArea.Scrollbar orientation="vertical" keepMounted data-testid="scrollbar-y" />
        <ScrollArea.Scrollbar orientation="horizontal" keepMounted data-testid="scrollbar-x" />
      </ScrollArea.Root>
    ));

    // All three parts write these variables unconditionally through the `style` prop, so the
    // inline style carries them even without layout measurement.
    const root = screen.getByTestId("root");
    expect(root.style.getPropertyValue(ScrollAreaRootCssVars.scrollAreaCornerHeight)).not.toBe("");
    expect(root.style.getPropertyValue(ScrollAreaRootCssVars.scrollAreaCornerWidth)).not.toBe("");
    expect(
      screen
        .getByTestId("scrollbar-y")
        .style.getPropertyValue(ScrollAreaScrollbarCssVars.scrollAreaThumbHeight),
    ).not.toBe("");
    expect(
      screen
        .getByTestId("scrollbar-x")
        .style.getPropertyValue(ScrollAreaScrollbarCssVars.scrollAreaThumbWidth),
    ).not.toBe("");
  });

  it.skipIf(isJSDOM)("names the overflow CSS variables per ScrollAreaViewportCssVars", async () => {
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
        <ScrollArea.Scrollbar orientation="vertical" keepMounted />
        <ScrollArea.Scrollbar orientation="horizontal" keepMounted />
      </ScrollArea.Root>
    ));

    const viewport = screen.getByTestId("viewport");

    await waitFor(() =>
      expect(
        viewport.style.getPropertyValue(ScrollAreaViewportCssVars.scrollAreaOverflowYStart),
      ).not.toBe(""),
    );
    expect(
      viewport.style.getPropertyValue(ScrollAreaViewportCssVars.scrollAreaOverflowYEnd),
    ).not.toBe("");
    expect(
      viewport.style.getPropertyValue(ScrollAreaViewportCssVars.scrollAreaOverflowXStart),
    ).not.toBe("");
    expect(
      viewport.style.getPropertyValue(ScrollAreaViewportCssVars.scrollAreaOverflowXEnd),
    ).not.toBe("");
  });
});
