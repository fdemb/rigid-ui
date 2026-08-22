import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { ScrollAreaFixture } from "../../test/ScrollAreaFixture";
import { isJSDOM, render } from "../../test/test-utils";

// Cross-part integration. Per-part contracts live next to each part.
describe.skipIf(isJSDOM)("ScrollArea", () => {
  it("detects overflow on both axes and sizes both thumbs", async () => {
    render(() => <ScrollAreaFixture />);

    await waitFor(() => expect(screen.getByTestId("root")).toHaveAttribute("data-has-overflow-x"));
    expect(screen.getByTestId("root")).toHaveAttribute("data-has-overflow-y");

    expect(screen.getByTestId("scrollbar-y")).toBeVisible();
    expect(screen.getByTestId("scrollbar-x")).toBeVisible();

    await waitFor(() =>
      expect(screen.getByTestId("thumb-y").getBoundingClientRect().height).toBeGreaterThan(0),
    );
    expect(screen.getByTestId("thumb-x").getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it("moves both thumbs and updates the overflow edges when scrolled", async () => {
    render(() => <ScrollAreaFixture />);

    const viewport = screen.getByTestId("viewport");
    await waitFor(() => expect(screen.getByTestId("thumb-y")).toBeVisible());

    viewport.scrollTop = 400;
    viewport.scrollLeft = 400;
    fireEvent.scroll(viewport);

    await waitFor(() =>
      expect(screen.getByTestId("thumb-y").style.transform).not.toBe("translate3d(0,0px,0)"),
    );
    expect(screen.getByTestId("thumb-x").style.transform).not.toBe("translate3d(0px,0,0)");
    expect(screen.getByTestId("root")).toHaveAttribute("data-overflow-x-start");
    expect(screen.getByTestId("root")).toHaveAttribute("data-overflow-y-start");
  });

  it("mounts the corner only while both axes overflow", async () => {
    render(() => <ScrollAreaFixture />);

    await waitFor(() => expect(screen.getByTestId("corner")).toBeInTheDocument());
  });
});
