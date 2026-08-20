import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { isJSDOM, render } from "../../../test/test-utils";
import { Popover } from "../index";

describe("<Popover.Viewport />", () => {
  it("renders children in the current container", () => {
    render(() => (
      <Popover.Root defaultOpen>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Viewport>
                <span data-testid="content">Content</span>
              </Popover.Viewport>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ));

    expect(screen.getByTestId("content").closest("[data-current]")).not.toBeNull();
  });

  it("remounts the current container when another trigger becomes active", async () => {
    render(() => (
      <Popover.Root>
        {(state) => (
          <>
            <Popover.Trigger payload="first">First</Popover.Trigger>
            <Popover.Trigger payload="second">Second</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Viewport>
                    <span data-testid="content">{String(state.payload)}</span>
                  </Popover.Viewport>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </>
        )}
      </Popover.Root>
    ));

    fireEvent.click(screen.getByRole("button", { name: "First" }));
    const firstContainer = await waitFor(() => {
      expect(screen.getByTestId("content")).toHaveTextContent("first");
      return screen.getByTestId("content").closest("[data-current]");
    });

    fireEvent.click(screen.getByRole("button", { name: "Second" }));
    await waitFor(() => {
      expect(screen.getByTestId("content")).toHaveTextContent("second");
      expect(screen.getByTestId("content").closest("[data-current]")).not.toBe(firstContainer);
    });
  });

  it("uses top and left positioning while a viewport is mounted", async () => {
    render(() => (
      <Popover.Root defaultOpen>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner data-testid="positioner">
            <Popover.Popup>
              <Popover.Viewport>Content</Popover.Viewport>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ));

    await waitFor(() => {
      const style = (screen.getByTestId("positioner") as HTMLElement).style;
      expect(style.position).toBe("absolute");
      expect(style.transform).toBe("");
      expect(style.top).not.toBe("");
      expect(style.left).not.toBe("");
    });
  });

  describe.skipIf(isJSDOM)("content transitions", () => {
    it("keeps a snapshot of the previous panel until descendant animations finish", async () => {
      render(() => (
        <>
          <style>{`
            [data-transitioning] [data-current] { animation: viewport-enter 50ms linear; }
            [data-transitioning] [data-previous] { animation: viewport-exit 50ms linear; }
            @keyframes viewport-enter { from { opacity: 0; } to { opacity: 1; } }
            @keyframes viewport-exit { from { opacity: 1; } to { opacity: 0; } }
          `}</style>
          <Popover.Root>
            {(state) => (
              <>
                <Popover.Trigger payload="first">First</Popover.Trigger>
                <Popover.Trigger payload="second">Second</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup>
                      <Popover.Viewport>
                        <span data-testid="content">{String(state.payload)}</span>
                      </Popover.Viewport>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </>
            )}
          </Popover.Root>
        </>
      ));

      fireEvent.click(screen.getByRole("button", { name: "First" }));
      await screen.findByText("first");
      fireEvent.click(screen.getByRole("button", { name: "Second" }));

      await waitFor(() => expect(document.querySelector("[data-previous]")).not.toBeNull());
      expect(document.querySelector("[data-previous]")).toHaveTextContent("first");
      await waitFor(() => expect(document.querySelector("[data-previous]")).toBeNull());
    });
  });
});
