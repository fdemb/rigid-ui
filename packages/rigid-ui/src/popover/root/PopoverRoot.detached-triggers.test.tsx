import { createSignal, Show } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { flushMicrotasks, render } from "../../../test/test-utils";
import { Popover } from "../index";

// Ported from Base UI's `root/PopoverRoot.detached-triggers.test.tsx`. Their Fast Refresh and
// stale-ref cases are React renderer specifics and do not apply.

function MultiTrigger() {
  return (
    <Popover.Root<number>>
      {(state) => (
        <>
          <Popover.Trigger payload={1} id="trigger-1">
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger payload={2} id="trigger-2">
            Trigger 2
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup data-testid="popup">
                <span data-testid="content">{state.payload}</span>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </>
      )}
    </Popover.Root>
  );
}

describe("<Popover.Root /> with multiple triggers", () => {
  describe("within Root", () => {
    it("opens from any trigger and renders that trigger's payload", async () => {
      render(() => <MultiTrigger />);

      fireEvent.click(screen.getByRole("button", { name: "Trigger 1" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("1"));

      fireEvent.click(screen.getByRole("button", { name: "Trigger 2" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));
    });

    it("invokes the payload render prop once, regardless of payload changes", async () => {
      let invocations = 0;
      render(() => (
        <Popover.Root<number>>
          {(state) => {
            invocations += 1;
            return (
              <>
                <Popover.Trigger payload={1} id="trigger-1">
                  Trigger 1
                </Popover.Trigger>
                <Popover.Trigger payload={2} id="trigger-2">
                  Trigger 2
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup>
                      <span data-testid="content">{state.payload}</span>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </>
            );
          }}
        </Popover.Root>
      ));

      expect(invocations).toBe(1);

      fireEvent.click(screen.getByRole("button", { name: "Trigger 1" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("1"));
      fireEvent.click(screen.getByRole("button", { name: "Trigger 2" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));

      // The render prop has component semantics: it builds the subtree once and reactivity
      // reaches the consumer through the `payload` getter. Re-running it here would recreate the
      // triggers, whose re-registration changes the payload again — an unbounded loop.
      expect(invocations).toBe(1);
    });

    it("stays open through a press on a sibling trigger", async () => {
      render(() => <MultiTrigger />);

      fireEvent.click(screen.getByRole("button", { name: "Trigger 1" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("1"));

      // A real press is pointerdown-then-click. The popover must survive the pointerdown: the
      // dismissal listener sees a target that is not the active trigger, and treating a sibling
      // as an outside press closes the popover and reopens it on click — a visible flicker.
      fireEvent.pointerDown(screen.getByRole("button", { name: "Trigger 2" }));
      await flushMicrotasks();
      expect(screen.getByTestId("positioner")).toHaveAttribute("data-open");
      expect(screen.getByTestId("content")).toHaveTextContent("1");

      fireEvent.click(screen.getByRole("button", { name: "Trigger 2" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));
      expect(screen.getByTestId("positioner")).toHaveAttribute("data-open");
    });

    it("reuses the popup and positioner DOM nodes when switching triggers", async () => {
      render(() => <MultiTrigger />);

      fireEvent.click(screen.getByRole("button", { name: "Trigger 1" }));
      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());
      const popup = screen.getByTestId("popup");
      const positioner = screen.getByTestId("positioner");

      fireEvent.click(screen.getByRole("button", { name: "Trigger 2" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));

      // Switching triggers must move the existing popup, not tear it down and rebuild it.
      expect(screen.getByTestId("popup")).toBe(popup);
      expect(screen.getByTestId("positioner")).toBe(positioner);
    });

    it("synchronizes ARIA attributes in controlled mode", async () => {
      render(() => (
        <Popover.Root open triggerId="trigger-2">
          <Popover.Trigger id="trigger-1">Trigger 1</Popover.Trigger>
          <Popover.Trigger id="trigger-2">Trigger 2</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const trigger1 = screen.getByRole("button", { name: "Trigger 1" });
      const trigger2 = screen.getByRole("button", { name: "Trigger 2" });
      const popup = await screen.findByRole("dialog");

      expect(trigger1).toHaveAttribute("aria-expanded", "false");
      expect(trigger1).not.toHaveAttribute("aria-controls");
      expect(trigger2).toHaveAttribute("aria-expanded", "true");
      expect(trigger2.getAttribute("aria-controls")).toBe(popup.getAttribute("id"));
    });

    it("synchronizes ARIA attributes for a controlled single trigger without triggerId", async () => {
      render(() => (
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const trigger = screen.getByRole("button", { name: "Trigger" });
      const popup = await screen.findByRole("dialog");

      await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
      expect(trigger.getAttribute("aria-controls")).toBe(popup.getAttribute("id"));
    });

    it("allows controlling the active trigger programmatically", async () => {
      function Test() {
        const [open, setOpen] = createSignal(false);
        const [activeTrigger, setActiveTrigger] = createSignal<string | null>(null);

        return (
          <Popover.Root<number>
            open={open()}
            triggerId={activeTrigger()}
            onOpenChange={(nextOpen, details) => {
              setActiveTrigger(details.trigger?.id ?? null);
              setOpen(nextOpen);
            }}
          >
            {(state) => (
              <>
                <Popover.Trigger payload={1} id="trigger-1">
                  Trigger 1
                </Popover.Trigger>
                <Popover.Trigger payload={2} id="trigger-2">
                  Trigger 2
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup>
                      <span data-testid="content">{state.payload}</span>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </>
            )}
          </Popover.Root>
        );
      }

      render(() => <Test />);

      fireEvent.click(screen.getByRole("button", { name: "Trigger 2" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));
      expect(screen.getByRole("button", { name: "Trigger 2" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("opens initially against defaultTriggerId", async () => {
      render(() => (
        <Popover.Root<number> defaultOpen defaultTriggerId="trigger-2">
          {(state) => (
            <>
              <Popover.Trigger payload={1} id="trigger-1">
                Trigger 1
              </Popover.Trigger>
              <Popover.Trigger payload={2} id="trigger-2">
                Trigger 2
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <span data-testid="content">{state.payload}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </>
          )}
        </Popover.Root>
      ));

      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));
      expect(screen.getByRole("button", { name: "Trigger 2" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("returns focus to the active trigger when closed", async () => {
      render(() => <MultiTrigger />);

      const trigger2 = screen.getByRole("button", { name: "Trigger 2" });
      fireEvent.click(trigger2);
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(trigger2).toHaveFocus());
    });

    it("keeps working when a conditional trigger unmounts while open", async () => {
      function Test() {
        const [showSecond, setShowSecond] = createSignal(true);
        return (
          <>
            <button onClick={() => setShowSecond(false)}>Remove</button>
            <Popover.Root<number>>
              {(state) => (
                <>
                  <Popover.Trigger payload={1} id="trigger-1">
                    Trigger 1
                  </Popover.Trigger>
                  <Show when={showSecond()}>
                    <Popover.Trigger payload={2} id="trigger-2">
                      Trigger 2
                    </Popover.Trigger>
                  </Show>
                  <Popover.Portal>
                    <Popover.Positioner data-testid="positioner">
                      <Popover.Popup>
                        <span data-testid="content">{state.payload}</span>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </>
              )}
            </Popover.Root>
          </>
        );
      }

      render(() => <Test />);

      fireEvent.click(screen.getByRole("button", { name: "Trigger 2" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));

      fireEvent.click(screen.getByRole("button", { name: "Remove" }));
      await waitFor(() => expect(screen.queryByRole("button", { name: "Trigger 2" })).toBeNull());

      // The remaining trigger must still drive the popover after its sibling disappeared.
      fireEvent.click(screen.getByRole("button", { name: "Trigger 1" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("1"));
    });
  });

  describe("detached triggers sharing a handle", () => {
    it("opens from any detached trigger and forwards its payload", async () => {
      const handle = Popover.createHandle<number>();
      render(() => (
        <>
          <Popover.Trigger handle={handle} id="detached-1" payload={1}>
            Detached 1
          </Popover.Trigger>
          <Popover.Trigger handle={handle} id="detached-2" payload={2}>
            Detached 2
          </Popover.Trigger>
          <Popover.Root<number> handle={handle}>
            {(state) => (
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner">
                  <Popover.Popup data-testid="popup">
                    <span data-testid="content">{state.payload}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </>
      ));

      fireEvent.click(screen.getByRole("button", { name: "Detached 1" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("1"));
      const popup = screen.getByTestId("popup");

      fireEvent.click(screen.getByRole("button", { name: "Detached 2" }));
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("2"));
      expect(screen.getByTestId("popup")).toBe(popup);
    });

    it("ignores imperative calls made before a root is attached", () => {
      const handle = Popover.createHandle();
      expect(() => handle.open("missing")).not.toThrow();
      expect(handle.isOpen).toBe(false);
      expect(() => handle.close()).not.toThrow();
    });

    it("ignores imperative calls made after the root is detached", async () => {
      const handle = Popover.createHandle<number>();
      const view = render(() => (
        <>
          <Popover.Trigger handle={handle} id="detached-1" payload={1}>
            Detached
          </Popover.Trigger>
          <Popover.Root<number> handle={handle}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </>
      ));

      handle.open("detached-1");
      await waitFor(() => expect(handle.isOpen).toBe(true));

      view.unmount();
      expect(handle.isOpen).toBe(false);
      expect(() => handle.open("detached-1")).not.toThrow();
      expect(() => handle.close()).not.toThrow();
    });

    it("throws when opened with an unregistered trigger id", async () => {
      const handle = Popover.createHandle();
      render(() => (
        <Popover.Root handle={handle}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      expect(() => handle.open("nope")).toThrow(
        'Rigid UI: Popover trigger with id "nope" is not registered.',
      );
    });

    it("warns when a handle is attached to more than one mounted root", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const handle = Popover.createHandle();

      try {
        render(() => (
          <>
            <Popover.Root handle={handle}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>First</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <Popover.Root handle={handle}>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Second</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </>
        ));

        expect(warn).toHaveBeenCalledWith(
          "Rigid UI: a Popover.Handle cannot be attached to multiple mounted roots.",
        );
      } finally {
        warn.mockRestore();
      }
    });
  });
});
