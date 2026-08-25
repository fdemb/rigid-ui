import { createSignal } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { isJSDOM, render, waitForPositioned, waitSingleFrame } from "../../../test/test-utils";
import { Tooltip } from "../index";

describe("<Tooltip.Viewport />", () => {
  it("forwards props and renders children in the current container", () => {
    let viewport!: HTMLDivElement;
    render(() => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger>Trigger</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              <Tooltip.Viewport ref={viewport} class="viewport" data-testid="viewport">
                <span data-testid="content">Content</span>
              </Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    expect(screen.getByTestId("viewport")).toBe(viewport);
    expect(viewport).toHaveClass("viewport");
    expect(screen.getByTestId("content").closest("[data-current]")).not.toBeNull();
  });

  it("remounts the current container when the active trigger changes", async () => {
    render(() => (
      <Tooltip.Root>
        {(state) => (
          <>
            <Tooltip.Trigger payload="first" data-testid="trigger-1">
              Trigger 1
            </Tooltip.Trigger>
            <Tooltip.Trigger payload="second" data-testid="trigger-2">
              Trigger 2
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>
                  <Tooltip.Viewport>
                    <span data-testid="content">{String(state.payload)}</span>
                  </Tooltip.Viewport>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </>
        )}
      </Tooltip.Root>
    ));

    fireEvent.focus(screen.getByTestId("trigger-1"));
    const firstContainer = await waitFor(() => {
      expect(screen.getByTestId("content")).toHaveTextContent("first");
      return screen.getByTestId("content").closest("[data-current]");
    });

    fireEvent.focus(screen.getByTestId("trigger-2"));
    await waitFor(() => {
      expect(screen.getByTestId("content")).toHaveTextContent("second");
      expect(screen.getByTestId("content").closest("[data-current]")).not.toBe(firstContainer);
    });
  });

  it("uses top and left positioning while a viewport is mounted", async () => {
    render(() => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger>Trigger</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner data-testid="positioner">
            <Tooltip.Popup>
              <Tooltip.Viewport>Content</Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    await waitFor(() => {
      const style = screen.getByTestId("positioner").style;
      expect(style.position).toBe("absolute");
      expect(style.transform).toBe("");
      expect(style.top).not.toBe("");
      expect(style.left).not.toBe("");
    });
  });

  it.skipIf(isJSDOM)("mirrors the tooltip instant type", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="trigger">Trigger</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>
              <Tooltip.Viewport data-testid="viewport">Content</Tooltip.Viewport>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    fireEvent.focus(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(screen.getByTestId("viewport")).toHaveAttribute("data-instant", "focus"),
    );
  });

  describe.skipIf(isJSDOM)("morphing containers with multiple triggers and payloads", () => {
    const animationStyles = `
      [data-transitioning] [data-previous] {
        animation: viewport-exit 300ms ease-out forwards;
      }
      [data-transitioning] [data-current] {
        animation: viewport-enter 300ms ease-out forwards;
      }
      @keyframes viewport-exit {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-30%); opacity: 0; }
      }
      @keyframes viewport-enter {
        from { transform: translateX(30%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;

    it("creates and cleans up morphing containers", async () => {
      render(() => (
        <>
          <style>{animationStyles}</style>
          <Tooltip.Root>
            {(state) => (
              <>
                <Tooltip.Trigger payload={0} data-testid="trigger-1">
                  Trigger 1
                </Tooltip.Trigger>
                <Tooltip.Trigger payload={1} data-testid="trigger-2">
                  Trigger 2
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup>
                      <Tooltip.Viewport data-testid="viewport">
                        Content {String(state.payload)}
                      </Tooltip.Viewport>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </>
            )}
          </Tooltip.Root>
        </>
      ));

      fireEvent.focus(screen.getByTestId("trigger-1"));
      await screen.findByText("Content 0");
      await waitSingleFrame();
      fireEvent.focus(screen.getByTestId("trigger-2"));

      const previous = await waitFor(() => {
        const element = document.querySelector<HTMLElement>("[data-previous]");
        expect(element).not.toBeNull();
        return element!;
      });
      expect(previous).toHaveAttribute("inert");
      expect(previous).toHaveTextContent("Content 0");
      expect(document.querySelector("[data-current]")).toHaveTextContent("Content 1");
      expect(screen.getByTestId("viewport")).toHaveAttribute("data-transitioning");

      await waitFor(() => expect(document.querySelector("[data-previous]")).toBeNull());
      expect(screen.getByTestId("viewport")).not.toHaveAttribute("data-transitioning");
    });

    it("keeps the latest transition active during rapid trigger changes", async () => {
      render(() => (
        <>
          <style>{animationStyles.replaceAll("300ms", "10s")}</style>
          <Tooltip.Root>
            {(state) => (
              <>
                <Tooltip.Trigger payload={1} data-testid="trigger-1">
                  Trigger 1
                </Tooltip.Trigger>
                <Tooltip.Trigger payload={2} data-testid="trigger-2">
                  Trigger 2
                </Tooltip.Trigger>
                <Tooltip.Trigger payload={3} data-testid="trigger-3">
                  Trigger 3
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup>
                      <Tooltip.Viewport data-testid="viewport">
                        Content {String(state.payload)}
                      </Tooltip.Viewport>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </>
            )}
          </Tooltip.Root>
        </>
      ));

      fireEvent.focus(screen.getByTestId("trigger-1"));
      await screen.findByText("Content 1");
      await waitSingleFrame();
      fireEvent.focus(screen.getByTestId("trigger-2"));
      await waitFor(() => {
        const current = screen.getByText("Content 2").closest("[data-current]");
        expect(current?.getAnimations()).toHaveLength(1);
      });
      await waitSingleFrame();

      fireEvent.focus(screen.getByTestId("trigger-3"));
      await waitFor(() => {
        const current = screen.getByText("Content 3").closest("[data-current]");
        expect(current?.getAnimations()).toHaveLength(1);
        expect(document.querySelector("[data-previous]")).toHaveTextContent("Content 2");
      });
      expect(screen.getByTestId("viewport")).toHaveAttribute("data-transitioning");
    });

    it("cleans up when a delayed payload remounts the current container", async () => {
      const [secondPayload, setSecondPayload] = createSignal<string>();
      const transitionStyles = `
        [data-transitioning] [data-current] {
          transition: transform 10s linear, opacity 10s linear;
        }
        [data-transitioning] [data-current][data-starting-style] {
          transform: translateX(30%);
          opacity: 0;
        }
        [data-transitioning] [data-previous] {
          transition: transform 10s linear, opacity 10s linear;
        }
        [data-transitioning] [data-previous][data-ending-style] {
          transform: translateX(-30%);
          opacity: 0;
        }
      `;

      render(() => (
        <>
          <style>{transitionStyles}</style>
          <Tooltip.Root>
            {(state) => (
              <>
                <Tooltip.Trigger data-testid="trigger-1">Trigger 1</Tooltip.Trigger>
                <Tooltip.Trigger payload={secondPayload()} data-testid="trigger-2">
                  Trigger 2
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup>
                      <Tooltip.Viewport data-testid="viewport">
                        Content {String(state.payload)}
                      </Tooltip.Viewport>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </>
            )}
          </Tooltip.Root>
        </>
      ));

      fireEvent.focus(screen.getByTestId("trigger-1"));
      await waitFor(() => expect(document.querySelector("[data-current]")).not.toBeNull());
      await waitSingleFrame();
      fireEvent.focus(screen.getByTestId("trigger-2"));
      await waitFor(() => expect(document.querySelector("[data-previous]")).not.toBeNull());
      await waitFor(() =>
        expect(document.querySelector("[data-current]")?.getAnimations().length).toBeGreaterThan(0),
      );
      await waitSingleFrame();

      const currentBeforePayload = document.querySelector("[data-current]");
      setSecondPayload("ready");
      await waitFor(() =>
        expect(document.querySelector("[data-current]")).not.toBe(currentBeforePayload),
      );
      await waitFor(() =>
        expect(document.querySelector("[data-current]")?.getAnimations().length).toBeGreaterThan(0),
      );

      await waitSingleFrame();
      await waitSingleFrame();
      expect(document.querySelector("[data-previous]")).not.toBeNull();

      for (const element of document.querySelectorAll("[data-previous], [data-current]")) {
        for (const animation of element.getAnimations()) animation.finish();
      }
      await waitFor(() => expect(document.querySelector("[data-previous]")).toBeNull());
      expect(screen.getByTestId("viewport")).not.toHaveAttribute("data-transitioning");
    });

    it("animates popup width and height to the new content size", async () => {
      render(() => (
        <Tooltip.Root>
          {(state) => (
            <>
              <Tooltip.Trigger payload="small" data-testid="trigger-1">
                Trigger 1
              </Tooltip.Trigger>
              <Tooltip.Trigger payload="large" data-testid="trigger-2">
                Trigger 2
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner data-testid="positioner">
                  <Tooltip.Popup
                    data-testid="popup"
                    style={{
                      width: "var(--popup-width)",
                      height: "var(--popup-height)",
                      transition: "width 10s linear, height 10s linear",
                    }}
                  >
                    <Tooltip.Viewport>
                      <div
                        style={{
                          width: state.payload === "large" ? "180px" : "80px",
                          height: state.payload === "large" ? "90px" : "30px",
                        }}
                      />
                    </Tooltip.Viewport>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </>
          )}
        </Tooltip.Root>
      ));

      fireEvent.focus(screen.getByTestId("trigger-1"));
      const positioner = await screen.findByTestId("positioner");
      await waitForPositioned(positioner);
      fireEvent.focus(screen.getByTestId("trigger-2"));

      await waitFor(() => {
        const popup = screen.getByTestId("popup");
        expect(popup.style.getPropertyValue("--popup-width")).toBe("180px");
        expect(popup.style.getPropertyValue("--popup-height")).toBe("90px");
        expect(popup.getAnimations().length).toBeGreaterThan(0);
      });
      const previous = document.querySelector<HTMLElement>("[data-previous]");
      expect(previous?.style.getPropertyValue("--popup-width")).toBe("80px");
      expect(previous?.style.getPropertyValue("--popup-height")).toBe("30px");
    });

    it.each([
      ["right down", { top: 10, left: 10 }, { top: 100, left: 200 }],
      ["left up", { top: 100, left: 200 }, { top: 10, left: 10 }],
      ["right ", { top: 50, left: 10 }, { top: 52, left: 200 }],
      [" down", { top: 10, left: 50 }, { top: 100, left: 52 }],
      [" ", { top: 50, left: 50 }, { top: 52, left: 52 }],
      ["left down", { top: 10, left: 200 }, { top: 100, left: 10 }],
      ["right up", { top: 100, left: 10 }, { top: 10, left: 200 }],
    ])("calculates the %s activation direction", async (expected, first, second) => {
      render(() => (
        <>
          <style>{animationStyles}</style>
          <Tooltip.Root>
            {(state) => (
              <>
                <Tooltip.Trigger
                  payload={0}
                  data-testid="trigger-1"
                  style={{
                    position: "absolute",
                    top: `${first.top}px`,
                    left: `${first.left}px`,
                    width: "100px",
                    height: "50px",
                  }}
                >
                  Trigger 1
                </Tooltip.Trigger>
                <Tooltip.Trigger
                  payload={1}
                  data-testid="trigger-2"
                  style={{
                    position: "absolute",
                    top: `${second.top}px`,
                    left: `${second.left}px`,
                    width: "100px",
                    height: "50px",
                  }}
                >
                  Trigger 2
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup>
                      <Tooltip.Viewport data-testid="viewport">
                        Content {String(state.payload)}
                      </Tooltip.Viewport>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </>
            )}
          </Tooltip.Root>
        </>
      ));

      fireEvent.focus(screen.getByTestId("trigger-1"));
      await screen.findByText("Content 0");
      await waitSingleFrame();
      fireEvent.focus(screen.getByTestId("trigger-2"));

      await waitFor(() =>
        expect(screen.getByTestId("viewport")).toHaveAttribute(
          "data-activation-direction",
          expected,
        ),
      );
    });
  });
});
