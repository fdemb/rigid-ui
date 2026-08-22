import { screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { ScrollArea } from "../index";
import { isJSDOM, render } from "../../../test/test-utils";

describe("<ScrollArea.Corner />", () => {
  it("stays unmounted while either axis does not overflow", () => {
    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Viewport />
        <ScrollArea.Corner data-testid="corner" />
      </ScrollArea.Root>
    ));

    expect(screen.queryByTestId("corner")).toBe(null);
  });

  describe.skipIf(isJSDOM)("interactions", () => {
    function renderBothAxes() {
      render(() => (
        <ScrollArea.Root data-testid="root" style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" style={{ width: "10px" }} />
          <ScrollArea.Scrollbar orientation="horizontal" style={{ height: "10px" }} />
          <ScrollArea.Corner data-testid="corner" />
        </ScrollArea.Root>
      ));
    }

    it("applies the corner size when both scrollbars are present", async () => {
      renderBothAxes();

      const corner = await screen.findByTestId("corner");

      await waitFor(() => {
        const style = getComputedStyle(corner);
        expect(style.getPropertyValue("--scroll-area-corner-width")).toBe("10px");
      });
      expect(getComputedStyle(corner).getPropertyValue("--scroll-area-corner-height")).toBe("10px");
    });

    it("sizes the corner element itself from the two tracks", async () => {
      renderBothAxes();

      const corner = await screen.findByTestId("corner");

      await waitFor(() => expect(corner.style.width).toBe("10px"));
      expect(corner.style.height).toBe("10px");
    });

    it("forwards the ref", async () => {
      let cornerRef: HTMLDivElement | undefined;

      render(() => (
        <ScrollArea.Root style={{ width: "200px", height: "200px" }}>
          <ScrollArea.Viewport style={{ width: "100%", height: "100%" }}>
            <div style={{ width: "1000px", height: "1000px" }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" style={{ width: "10px" }} />
          <ScrollArea.Scrollbar orientation="horizontal" style={{ height: "10px" }} />
          <ScrollArea.Corner
            ref={(element) => (cornerRef = element)}
            data-testid="corner-with-ref"
          />
        </ScrollArea.Root>
      ));

      const corner = await screen.findByTestId("corner-with-ref");
      expect(cornerRef).toBe(corner);
    });
  });
});
