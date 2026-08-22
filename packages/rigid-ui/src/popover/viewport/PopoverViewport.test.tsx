import { createSignal } from "solid-js";
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

    const transitionStyles = `
      [data-transitioning] [data-current] { transition: opacity 1s linear; opacity: 1; }
      [data-transitioning] [data-current][data-starting-style] { opacity: 0; }
      [data-transitioning] [data-previous] { transition: opacity 1s linear; opacity: 1; }
      [data-transitioning] [data-previous][data-ending-style] { opacity: 0; }
    `;

    it("replaces the previous snapshot when the trigger changes again mid-transition", async () => {
      render(() => (
        <>
          <style>{`
            [data-transitioning] [data-current] { animation: viewport-enter 1s linear; }
            [data-transitioning] [data-previous] { animation: viewport-exit 1s linear; }
            @keyframes viewport-enter { from { opacity: 0; } to { opacity: 1; } }
            @keyframes viewport-exit { from { opacity: 1; } to { opacity: 0; } }
          `}</style>
          <Popover.Root>
            {(state) => (
              <>
                <Popover.Trigger payload="first">First</Popover.Trigger>
                <Popover.Trigger payload="second">Second</Popover.Trigger>
                <Popover.Trigger payload="third">Third</Popover.Trigger>
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
      await waitFor(() =>
        expect(document.querySelector("[data-previous]")).toHaveTextContent("first"),
      );

      // The first exit animation is still running, so the container is reused rather than
      // remounted — its contents must still be swapped for the panel that just left.
      fireEvent.click(screen.getByRole("button", { name: "Third" }));
      await waitFor(() => {
        expect(document.querySelector("[data-current]")).toHaveTextContent("third");
        expect(document.querySelector("[data-previous]")).toHaveTextContent("second");
      });
    });

    it("marks the previous panel with `data-ending-style` once the entry is armed", async () => {
      render(() => (
        <>
          <style>{transitionStyles}</style>
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
      const previous = await waitFor(() => {
        const element = document.querySelector("[data-previous]");
        expect(element).not.toBeNull();
        return element as HTMLElement;
      });

      await waitFor(() => {
        expect(previous).toHaveAttribute("data-ending-style");
        expect(document.querySelector("[data-current]")).not.toHaveAttribute("data-starting-style");
      });
      // The attribute lands one frame before the 1s transition has advanced far enough to read a
      // sub-1 opacity, so poll rather than sampling the frame the attribute appeared on.
      await waitFor(() => expect(Number(getComputedStyle(previous).opacity)).toBeLessThan(1));
    });

    it("clears `data-starting-style` when a kept-mounted popup closes mid-transition", async () => {
      const [open, setOpen] = createSignal(false);

      render(() => (
        <>
          <style>{transitionStyles}</style>
          <Popover.Root open={open()} onOpenChange={setOpen}>
            {(state) => (
              <>
                <Popover.Trigger payload="first">First</Popover.Trigger>
                <Popover.Trigger payload="second">Second</Popover.Trigger>
                <Popover.Portal keepMounted>
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

      // Closing here re-runs the arming effect, which bails before it can hand the flag back.
      setOpen(false);
      await waitFor(() =>
        expect(document.querySelector("[data-current]")).not.toHaveAttribute("data-starting-style"),
      );

      // The stale flag used to survive the reopen and pin the entry styles at their `from` state.
      setOpen(true);
      fireEvent.click(screen.getByRole("button", { name: "First" }));
      await waitFor(() => {
        expect(document.querySelector("[data-current]")).toHaveTextContent("first");
        expect(document.querySelector("[data-current]")).not.toHaveAttribute("data-starting-style");
      });
    });
  });
});
