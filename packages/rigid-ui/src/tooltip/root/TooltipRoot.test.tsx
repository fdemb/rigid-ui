import { createSignal } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { flushMicrotasks, isJSDOM, render, resetBrowserPointer } from "../../../test/test-utils";
import { Tooltip, type TooltipTrackCursorAxis } from "../index";

// Ported from Base UI's `tooltip/root/TooltipRoot.test.tsx`.
// Hover timing runs on real timers with small delays so positioning frames stay real.

const DELAY = 5;
const CLOSE_DELAY = 10;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function TestTooltip(
  props: {
    open?: boolean;
    defaultOpen?: boolean;
    delay?: number;
    closeDelay?: number;
    disabled?: boolean;
    triggerDisabled?: boolean;
    disableHoverablePopup?: boolean;
    trackCursorAxis?: TooltipTrackCursorAxis;
    closeOnClick?: boolean;
    onOpenChange?: (open: boolean, details: Tooltip.Root.ChangeEventDetails) => void;
  } = {},
) {
  return (
    <Tooltip.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      disabled={props.disabled}
      disableHoverablePopup={props.disableHoverablePopup}
      trackCursorAxis={props.trackCursorAxis}
      onOpenChange={props.onOpenChange}
    >
      <Tooltip.Trigger
        data-testid="trigger"
        disabled={props.triggerDisabled}
        closeOnClick={props.closeOnClick}
        delay={props.delay ?? DELAY}
        closeDelay={props.closeDelay ?? CLOSE_DELAY}
      >
        Toggle
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner data-testid="positioner">
          <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function hoverTrigger(trigger: Element) {
  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
}

function leaveTrigger(trigger: Element) {
  fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
}

describe("Tooltip", () => {
  beforeEach(resetBrowserPointer);

  describe("uncontrolled open", () => {
    it("opens after the rest delay and closes when the pointer leaves", async () => {
      render(() => <TestTooltip />);

      const trigger = screen.getByText("Toggle");
      expect(screen.queryByText("Content")).toBeNull();
      expect(trigger).not.toHaveAttribute("data-closed");

      hoverTrigger(trigger);
      // The tooltip must not open before the pointer rests.
      await sleep(1);
      expect(screen.queryByText("Content")).toBeNull();

      await waitFor(() => expect(screen.getByText("Content")).toBeVisible());
      expect(trigger).toHaveAttribute("data-popup-open");

      leaveTrigger(trigger);
      // The close delay keeps it mounted briefly.
      await sleep(2);
      expect(screen.queryByTestId("popup")).not.toBeNull();

      await waitFor(() => expect(screen.queryByText("Content")).toBeNull());
      expect(trigger).not.toHaveAttribute("data-popup-open");
      expect(trigger).not.toHaveAttribute("data-closed");
    });

    it("respects a custom delay before opening", async () => {
      render(() => <TestTooltip delay={80} />);
      const trigger = screen.getByText("Toggle");

      hoverTrigger(trigger);
      await sleep(30);
      expect(screen.queryByText("Content")).toBeNull();

      await waitFor(() => expect(screen.getByText("Content")).toBeVisible());
    });

    it("waits out the close delay after the pointer leaves", async () => {
      render(() => <TestTooltip closeDelay={80} />);
      const trigger = screen.getByText("Toggle");

      hoverTrigger(trigger);
      await screen.findByTestId("popup");

      leaveTrigger(trigger);
      await sleep(30);
      expect(screen.queryByTestId("popup")).not.toBeNull();

      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
    });
  });

  describe("focus", () => {
    it("opens instantly on keyboard-style focus and closes on blur", async () => {
      render(() => <TestTooltip />);
      const trigger = screen.getByText("Toggle");

      fireEvent.focus(trigger);
      const popup = await screen.findByTestId("popup");
      expect(popup).toHaveAttribute("data-instant", "focus");

      fireEvent.blur(trigger);
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
    });

    it("ignores focus that comes from a press, letting the click decide", async () => {
      const handleOpenChange = vi.fn();
      render(() => <TestTooltip delay={200} onOpenChange={handleOpenChange} />);
      const trigger = screen.getByText("Toggle");

      // A real press sequence: pointerdown, then the focus it generates, then click. The focus
      // must not open the tooltip; only a keyboard Tab would.
      fireEvent.pointerDown(trigger, { pointerType: "mouse" });
      fireEvent.focus(trigger);
      fireEvent.click(trigger);
      await sleep(260);

      expect(handleOpenChange).not.toHaveBeenCalled();
      expect(screen.queryByText("Content")).toBeNull();
    });

    it("does not steal the close from an already hover-opened tooltip on blur", async () => {
      render(() => <TestTooltip closeDelay={80} />);
      const trigger = screen.getByText("Toggle");

      hoverTrigger(trigger);
      await screen.findByTestId("popup");

      // The pointer left but the tooltip is still within its close delay; blur should not
      // fight the hover ownership while the reason is still `trigger-hover`.
      fireEvent.blur(trigger);
      await sleep(2);
      expect(screen.queryByTestId("popup")).not.toBeNull();
    });
  });

  describe("controlled open", () => {
    it("reports change reasons and honors cancellation", async () => {
      const changes: Array<[boolean, string]> = [];
      render(() => (
        <TestTooltip
          onOpenChange={(open, details) => {
            if (open && details.reason === "trigger-hover") {
              details.cancel();
              return;
            }
            changes.push([open, details.reason]);
          }}
        />
      ));
      const trigger = screen.getByText("Toggle");

      hoverTrigger(trigger);
      await sleep(DELAY + 20);
      // Canceled opens never surface.
      expect(changes).toEqual([]);
      expect(screen.queryByText("Content")).toBeNull();

      fireEvent.focus(trigger);
      await waitFor(() => expect(changes).toEqual([[true, "trigger-focus"]]));
    });

    it("does not open a controlled closed tooltip", async () => {
      render(() => <TestTooltip open={false} />);
      const trigger = screen.getByText("Toggle");

      hoverTrigger(trigger);
      await sleep(DELAY + 20);
      expect(screen.queryByText("Content")).toBeNull();
    });
  });

  describe("prop: defaultOpen", () => {
    it("renders open initially", async () => {
      render(() => <TestTooltip defaultOpen />);
      await screen.findByTestId("popup");
    });
  });

  describe("dismissal", () => {
    it("closes on Escape", async () => {
      render(() => <TestTooltip defaultOpen />);
      await screen.findByTestId("popup");

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
    });
  });

  describe("click behavior", () => {
    it("cancels a pending delayed open without reporting a change", async () => {
      const handleOpenChange = vi.fn();
      render(() => <TestTooltip delay={200} onOpenChange={handleOpenChange} />);
      const trigger = screen.getByText("Toggle");

      hoverTrigger(trigger);
      fireEvent.click(trigger);
      await sleep(260);

      expect(handleOpenChange).not.toHaveBeenCalled();
      expect(screen.queryByText("Content")).toBeNull();
    });

    it("closes an open tooltip on click unless closeOnClick is false", async () => {
      render(() => <TestTooltip defaultOpen closeOnClick={false} />);
      await screen.findByTestId("popup");

      fireEvent.click(screen.getByText("Toggle"));
      await sleep(20);
      expect(screen.queryByTestId("popup")).not.toBeNull();
    });

    it("closes an open tooltip on click by default", async () => {
      render(() => <TestTooltip defaultOpen />);
      await screen.findByTestId("popup");

      fireEvent.click(screen.getByText("Toggle"));
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
    });
  });

  describe("prop: actionsRef", () => {
    it("closes imperatively through the close method", async () => {
      let actions: Tooltip.Root.Actions | undefined;
      render(() => (
        <Tooltip.Root
          defaultOpen
          actionsRef={(ref) => {
            actions = ref;
          }}
        >
          <Tooltip.Trigger>Toggle</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ));
      await screen.findByTestId("popup");

      actions?.close();
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
    });
  });

  describe("prop: disabled", () => {
    it("blocks hover and focus opens and marks the trigger", async () => {
      render(() => <TestTooltip disabled />);
      const trigger = screen.getByText("Toggle");
      expect(trigger).toHaveAttribute("data-trigger-disabled");
      expect(trigger).not.toHaveAttribute("disabled");

      hoverTrigger(trigger);
      await sleep(DELAY + 20);
      expect(screen.queryByText("Content")).toBeNull();

      fireEvent.focus(trigger);
      await sleep(5);
      expect(screen.queryByText("Content")).toBeNull();
    });

    it("stays disabled when the root is disabled and the trigger opts back in", async () => {
      render(() => <TestTooltip disabled triggerDisabled={false} delay={0} />);
      const trigger = screen.getByText("Toggle");

      expect(trigger).not.toHaveAttribute("data-trigger-disabled");

      hoverTrigger(trigger);
      await sleep(20);
      expect(screen.queryByText("Content")).toBeNull();
    });

    it("disables the tooltip without disabling the trigger element", async () => {
      render(() => <TestTooltip triggerDisabled />);
      const trigger = screen.getByText("Toggle");

      expect(trigger).toHaveAttribute("data-trigger-disabled");
      expect(trigger).not.toHaveAttribute("disabled");
    });

    it("closes an open tooltip when it becomes disabled", async () => {
      const changes: Array<[boolean, string]> = [];

      function TestCase() {
        const [disabled, setDisabled] = createSignal(false);
        return (
          <>
            <button data-testid="disable" onClick={() => setDisabled(true)}>
              disable
            </button>
            <TestTooltip
              defaultOpen
              disabled={disabled()}
              onOpenChange={(open, details) => changes.push([open, details.reason])}
            />
          </>
        );
      }
      render(() => <TestCase />);
      await screen.findByTestId("popup");

      fireEvent.click(screen.getByTestId("disable"));
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
      expect(changes).toEqual([[false, "disabled"]]);
    });
  });

  describe("hoverable popup", () => {
    it("keeps the tooltip open while the pointer travels onto the popup", async () => {
      render(() => <TestTooltip closeDelay={120} />);
      const trigger = screen.getByText("Toggle");

      hoverTrigger(trigger);
      const popup = await screen.findByTestId("popup");

      leaveTrigger(trigger);
      // Entering the positioner cancels the pending close.
      fireEvent.pointerEnter(popup.parentElement!, { pointerType: "mouse" });
      await sleep(160);
      expect(screen.queryByTestId("popup")).not.toBeNull();
    });

    it("applies pointer-events: none to the positioner when disableHoverablePopup is set", async () => {
      render(() => <TestTooltip defaultOpen disableHoverablePopup />);
      const popup = await screen.findByTestId("popup");
      const positioner = popup.parentElement!;
      await waitFor(() => {
        expect(positioner.style.pointerEvents).toBe("none");
      });
    });

    describe("prop: trackCursorAxis", () => {
      it("makes the positioner inert when tracking both axes", async () => {
        render(() => <TestTooltip trackCursorAxis="both" delay={0} />);

        const trigger = screen.getByRole("button", { name: "Toggle" });
        fireEvent.pointerDown(trigger, {
          pointerType: "mouse",
          clientX: 20,
          clientY: 20,
        });
        fireEvent.pointerEnter(trigger, {
          pointerType: "mouse",
          clientX: 20,
          clientY: 20,
        });
        fireEvent.mouseMove(trigger, { clientX: 20, clientY: 20 });

        const positioner = await screen.findByTestId("positioner");
        expect(positioner.style.pointerEvents).toBe("none");
        expect(positioner).toHaveAttribute("inert");
        expect(positioner).toHaveAttribute("data-instant", "tracking-cursor");
      });

      it("keeps the positioner hoverable when tracking a single axis", async () => {
        render(() => <TestTooltip trackCursorAxis="x" delay={0} />);

        const trigger = screen.getByRole("button", { name: "Toggle" });
        fireEvent.pointerDown(trigger, {
          pointerType: "mouse",
          clientX: 20,
          clientY: 20,
        });
        fireEvent.pointerEnter(trigger, {
          pointerType: "mouse",
          clientX: 20,
          clientY: 20,
        });
        fireEvent.mouseMove(trigger, { clientX: 20, clientY: 20 });

        const positioner = await screen.findByTestId("positioner");
        expect(positioner.style.pointerEvents).toBe("");
        expect(positioner).not.toHaveAttribute("inert");
        expect(positioner).toHaveAttribute("data-instant", "tracking-cursor");
      });
    });
  });

  describe.skipIf(isJSDOM)("positioning", () => {
    it("positions above the trigger by default and renders side attributes", async () => {
      render(() => (
        <div style={{ "margin-top": "300px" }}>
          <TestTooltip defaultOpen />
        </div>
      ));
      const popup = await screen.findByTestId("popup");
      const positioner = popup.parentElement!;

      await waitFor(() => {
        expect(positioner.style.opacity).not.toBe("0");
      });
      expect(popup.getAttribute("data-side")).toBe("top");
    });

    it("tracks the cursor on the first delayed hover when trackCursorAxis is x", async () => {
      render(() => (
        <div style={{ "padding-top": "100px", "padding-left": "40px" }}>
          <Tooltip.Root trackCursorAxis="x">
            <Tooltip.Trigger delay={100} style={{ width: "300px", height: "40px" }}>
              Trigger
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner data-testid="tracked-positioner" side="bottom">
                <Tooltip.Popup style={{ width: "40px", height: "20px" }}>Tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      ));

      const trigger = screen.getByRole("button", { name: "Trigger" });
      const triggerRect = trigger.getBoundingClientRect();
      const cursorX = triggerRect.left + 240;
      const cursorY = triggerRect.top + 20;

      fireEvent.pointerDown(trigger, { pointerType: "mouse", clientX: cursorX, clientY: cursorY });
      fireEvent.pointerEnter(trigger, {
        pointerType: "mouse",
        clientX: cursorX,
        clientY: cursorY,
      });
      fireEvent.mouseMove(trigger, { clientX: cursorX, clientY: cursorY });

      const positioner = await screen.findByTestId("tracked-positioner");
      await waitFor(() => {
        const rect = positioner.getBoundingClientRect();
        expect(Math.abs(rect.left + rect.width / 2 - cursorX)).toBeLessThanOrEqual(2);
      });
    });

    it("follows mouse movement while open", async () => {
      render(() => (
        <div style={{ "padding-top": "100px", "padding-left": "40px" }}>
          <Tooltip.Root trackCursorAxis="x">
            <Tooltip.Trigger delay={0} style={{ width: "300px", height: "40px" }}>
              Trigger
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner data-testid="tracked-positioner" side="bottom">
                <Tooltip.Popup style={{ width: "40px", height: "20px" }}>Tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      ));

      const trigger = screen.getByRole("button", { name: "Trigger" });
      const triggerRect = trigger.getBoundingClientRect();
      const firstCursorX = triggerRect.left + 60;
      const secondCursorX = triggerRect.left + 240;
      const cursorY = triggerRect.top + 20;

      fireEvent.pointerEnter(trigger, {
        pointerType: "mouse",
        clientX: firstCursorX,
        clientY: cursorY,
      });
      fireEvent.mouseMove(trigger, { clientX: firstCursorX, clientY: cursorY });

      const positioner = await screen.findByTestId("tracked-positioner");
      await waitFor(() => {
        const rect = positioner.getBoundingClientRect();
        expect(Math.abs(rect.left + rect.width / 2 - firstCursorX)).toBeLessThanOrEqual(2);
      });

      fireEvent.mouseMove(window, { clientX: secondCursorX, clientY: cursorY });
      await waitFor(() => {
        const rect = positioner.getBoundingClientRect();
        expect(Math.abs(rect.left + rect.width / 2 - secondCursorX)).toBeLessThanOrEqual(2);
      });
    });

    it("stops tracking the cursor after trackCursorAxis is disabled while closed", async () => {
      function TestCase() {
        const [trackCursorAxis, setTrackCursorAxis] = createSignal<TooltipTrackCursorAxis>("x");
        return (
          <div style={{ "padding-top": "100px", "padding-left": "40px" }}>
            <button onClick={() => setTrackCursorAxis("none")}>Disable tracking</button>
            <Tooltip.Root trackCursorAxis={trackCursorAxis()}>
              <Tooltip.Trigger delay={20} closeDelay={0} style={{ width: "300px", height: "40px" }}>
                Trigger
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner data-testid="tracked-positioner" side="bottom">
                  <Tooltip.Popup style={{ width: "40px", height: "20px" }}>Tooltip</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        );
      }

      render(() => <TestCase />);
      const trigger = screen.getByRole("button", { name: "Trigger" });
      const triggerRect = trigger.getBoundingClientRect();
      const cursorX = triggerRect.left + 240;
      const cursorY = triggerRect.top + 20;

      fireEvent.pointerEnter(trigger, {
        pointerType: "mouse",
        clientX: cursorX,
        clientY: cursorY,
      });
      fireEvent.mouseMove(trigger, { clientX: cursorX, clientY: cursorY });
      const tracked = await screen.findByTestId("tracked-positioner");
      await waitFor(() => {
        const rect = tracked.getBoundingClientRect();
        expect(Math.abs(rect.left + rect.width / 2 - cursorX)).toBeLessThanOrEqual(2);
      });

      fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
      await waitFor(() => expect(screen.queryByTestId("tracked-positioner")).toBeNull());
      fireEvent.click(screen.getByRole("button", { name: "Disable tracking" }));

      fireEvent.pointerEnter(trigger, {
        pointerType: "mouse",
        clientX: cursorX,
        clientY: cursorY,
      });
      fireEvent.mouseMove(trigger, { clientX: cursorX, clientY: cursorY });
      const untracked = await screen.findByTestId("tracked-positioner");
      await waitFor(() => {
        const rect = untracked.getBoundingClientRect();
        const triggerCenterX = triggerRect.left + triggerRect.width / 2;
        expect(Math.abs(rect.left + rect.width / 2 - triggerCenterX)).toBeLessThanOrEqual(2);
      });
    });

    it("updates the tracked cursor position after closing and reopening", async () => {
      render(() => (
        <div style={{ "padding-top": "100px", "padding-left": "40px" }}>
          <Tooltip.Root trackCursorAxis="x">
            <Tooltip.Trigger delay={20} closeDelay={0} style={{ width: "300px", height: "40px" }}>
              Trigger
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner data-testid="tracked-positioner" side="bottom">
                <Tooltip.Popup style={{ width: "40px", height: "20px" }}>Tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      ));

      const trigger = screen.getByRole("button", { name: "Trigger" });
      const triggerRect = trigger.getBoundingClientRect();
      const firstCursorX = triggerRect.left + 240;
      const secondCursorX = triggerRect.left + 60;
      const cursorY = triggerRect.top + 20;

      fireEvent.pointerEnter(trigger, {
        pointerType: "mouse",
        clientX: firstCursorX,
        clientY: cursorY,
      });
      fireEvent.mouseMove(trigger, { clientX: firstCursorX, clientY: cursorY });
      const first = await screen.findByTestId("tracked-positioner");
      await waitFor(() => {
        const rect = first.getBoundingClientRect();
        expect(Math.abs(rect.left + rect.width / 2 - firstCursorX)).toBeLessThanOrEqual(2);
      });

      fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
      await waitFor(() => expect(screen.queryByTestId("tracked-positioner")).toBeNull());

      fireEvent.pointerEnter(trigger, {
        pointerType: "mouse",
        clientX: secondCursorX,
        clientY: cursorY,
      });
      fireEvent.mouseMove(trigger, { clientX: secondCursorX, clientY: cursorY });
      const second = await screen.findByTestId("tracked-positioner");
      await waitFor(() => {
        const rect = second.getBoundingClientRect();
        expect(Math.abs(rect.left + rect.width / 2 - secondCursorX)).toBeLessThanOrEqual(2);
      });
    });
  });

  describe("provider", () => {
    it("inherits group delay", async () => {
      render(() => (
        <Tooltip.Provider delay={80}>
          <Tooltip.Root>
            <Tooltip.Trigger>Toggle</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ));
      const trigger = screen.getByText("Toggle");

      hoverTrigger(trigger);
      await sleep(30);
      expect(screen.queryByText("Content")).toBeNull();

      await waitFor(() => expect(screen.getByText("Content")).toBeVisible());
    });

    it.skipIf(isJSDOM)("switches adjacent tooltips without animations", async () => {
      render(() => (
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="trigger-1" delay={DELAY} closeDelay={CLOSE_DELAY}>
              One
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="popup-1">First</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="trigger-2" delay={DELAY} closeDelay={CLOSE_DELAY}>
              Two
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="popup-2">Second</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ));

      const trigger1 = screen.getByTestId("trigger-1");
      const trigger2 = screen.getByTestId("trigger-2");

      hoverTrigger(trigger1);
      const first = await screen.findByTestId("popup-1");
      await waitFor(() => expect(first.getAttribute("data-instant") == null).toBe(true));

      // Moving to the second trigger closes the first as a displacement (reason `none`) and
      // opens the second with `data-instant="delay"`, skipping both animations.
      leaveTrigger(trigger1);
      hoverTrigger(trigger2);

      const second = await screen.findByTestId("popup-2");
      await waitFor(() => {
        expect(second).toHaveAttribute("data-instant", "delay");
      });
      await waitFor(() => expect(screen.queryByTestId("popup-1")).toBeNull());
    });
  });

  describe("detached triggers", () => {
    it("connects detached triggers through a handle", async () => {
      const handle = Tooltip.createHandle();
      render(() => (
        <div>
          <Tooltip.Trigger handle={handle} id="detached">
            Detached
          </Tooltip.Trigger>
          <Tooltip.Root handle={handle}>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      ));

      const trigger = screen.getByText("Detached");
      hoverTrigger(trigger);
      await waitFor(() => expect(handle.isOpen).toBe(true));

      handle.close();
      await waitFor(() => expect(handle.isOpen).toBe(false));
    });

    it("passes the payload of the active trigger to the render prop", async () => {
      const handle = Tooltip.createHandle<string>();
      render(() => (
        <div>
          <Tooltip.Trigger handle={handle} id="one" payload="first">
            One
          </Tooltip.Trigger>
          {/* The render prop receives a real props object; read `state.payload`, do not destructure. */}
          <Tooltip.Root handle={handle}>
            {(state) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>Payload: {state.payload}</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>
      ));

      hoverTrigger(screen.getByText("One"));
      await waitFor(() => expect(screen.getByText(/Payload: first/)).toBeVisible());
    });
  });

  describe("forwarding", () => {
    it("forwards native props, class, style, and refs to Trigger and Popup", async () => {
      let popupElement: HTMLDivElement | undefined;
      render(() => (
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger class="custom-trigger" aria-label="Custom">
            Toggle
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup
                class="custom-popup"
                style={{ color: "red" }}
                ref={(node: HTMLDivElement) => {
                  popupElement = node;
                }}
              >
                Content
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ));

      const trigger = screen.getByLabelText("Custom");
      expect(trigger).toHaveClass("custom-trigger");

      const popup = await screen.findByText("Content");
      expect(popup).toHaveClass("custom-popup");
      expect(popupElement).toBe(popup);
    });
  });

  describe("onOpenChangeComplete", () => {
    it("is called after opening finishes and after closing finishes", async () => {
      const complete = vi.fn();
      render(() => (
        <Tooltip.Root defaultOpen onOpenChangeComplete={complete}>
          <Tooltip.Trigger>Toggle</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="popup">Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ));
      await screen.findByTestId("popup");
      await waitFor(() => expect(complete).toHaveBeenCalledWith(true));

      leaveTrigger(screen.getByText("Toggle"));
      await waitFor(() => expect(complete).toHaveBeenLastCalledWith(false));
    });
  });
});

describe("nested tooltips", () => {
  beforeEach(resetBrowserPointer);

  it("does not open the outer tooltip when hovering over a nested tooltip trigger", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          Outer
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerDown(innerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(innerTrigger, { clientX: 10, clientY: 10 });
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 10, clientY: 10 });

    await sleep(DELAY + 10);
    await flushMicrotasks();

    await screen.findByTestId("inner-popup");
    expect(screen.getByTestId("inner-popup")).not.toBeNull();
    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("does not open the outer tooltip when moving between sibling nested triggers", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          Outer
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-a-trigger">Inner A</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-a-popup">Inner A tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-b-trigger">Inner B</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-b-popup">Inner B tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerATrigger = screen.getByTestId("inner-a-trigger");
    const innerBTrigger = screen.getByTestId("inner-b-trigger");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerATrigger, { pointerType: "mouse", clientX: 30, clientY: 10 });
    fireEvent.mouseEnter(innerATrigger);
    fireEvent.mouseOver(innerATrigger);
    fireEvent.mouseMove(innerATrigger, { clientX: 30, clientY: 10 });

    await sleep(DELAY + 10);
    await flushMicrotasks();

    await screen.findByTestId("inner-a-popup");
    expect(screen.getByTestId("inner-a-popup")).not.toBeNull();
    expect(screen.queryByTestId("inner-b-popup")).toBeNull();
    expect(screen.queryByTestId("outer-popup")).toBeNull();

    fireEvent.mouseOut(innerATrigger, { relatedTarget: innerBTrigger });
    fireEvent.pointerLeave(innerATrigger, { relatedTarget: innerBTrigger });
    fireEvent.pointerEnter(innerBTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerBTrigger);
    fireEvent.mouseOver(innerBTrigger);
    fireEvent.mouseMove(innerBTrigger, { clientX: 50, clientY: 10 });

    await sleep(DELAY + 10);
    await flushMicrotasks();

    await waitFor(() => expect(screen.queryByTestId("inner-a-popup")).toBeNull());
    await screen.findByTestId("inner-b-popup");
    expect(screen.getByTestId("inner-b-popup")).not.toBeNull();
    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("does not open ancestor tooltips when hovering over a third-level nested trigger", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="grandparent-trigger" render="span">
          Grandparent
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="parent-trigger" render="span">
              Parent
              <Tooltip.Root>
                <Tooltip.Trigger data-testid="child-trigger">Child</Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup data-testid="child-popup">Child tooltip</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="parent-popup">Parent tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="grandparent-popup">Grandparent tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const grandparentTrigger = screen.getByTestId("grandparent-trigger");
    const parentTrigger = screen.getByTestId("parent-trigger");
    const childTrigger = screen.getByTestId("child-trigger");

    fireEvent.pointerEnter(grandparentTrigger, {
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
    });
    fireEvent.mouseEnter(grandparentTrigger);
    fireEvent.pointerEnter(parentTrigger, { pointerType: "mouse", clientX: 30, clientY: 10 });
    fireEvent.mouseEnter(parentTrigger);
    fireEvent.pointerEnter(childTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(childTrigger);
    fireEvent.mouseOver(childTrigger);
    fireEvent.mouseMove(childTrigger, { clientX: 50, clientY: 10 });

    await sleep(DELAY + 10);
    await flushMicrotasks();

    await screen.findByTestId("child-popup");
    expect(screen.getByTestId("child-popup")).not.toBeNull();
    expect(screen.queryByTestId("parent-popup")).toBeNull();
    expect(screen.queryByTestId("grandparent-popup")).toBeNull();
  });

  it("opens the outer tooltip when moving from a nested trigger to the parent area with zero delay", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span" delay={0}>
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");

    fireEvent.pointerDown(innerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(innerTrigger, { clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);

    await flushMicrotasks();
    await waitFor(() => expect(screen.queryByTestId("outer-popup")).toBeNull());

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);

    await flushMicrotasks();
    await screen.findByTestId("outer-popup");
    expect(screen.getByTestId("outer-popup")).not.toBeNull();
  });

  it("does not open a disabled outer tooltip when moving from a nested trigger to the parent area with zero delay", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span" delay={0} disabled>
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");

    fireEvent.pointerDown(innerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(innerTrigger, { clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);

    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);

    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("reopens the delayed outer tooltip when moving from a nested trigger to the parent area", async () => {
    const delay = 30;

    render(() => (
      <Tooltip.Provider delay={delay}>
        <Tooltip.Root>
          <Tooltip.Trigger data-testid="outer-trigger" render="span">
            <span data-testid="outer-area">Outer</span>
            <Tooltip.Root>
              <Tooltip.Trigger data-testid="inner-trigger" delay={delay * 10}>
                Inner
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });

    await sleep(delay + 10);
    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);

    await sleep(delay + 10);
    await flushMicrotasks();
    expect(screen.getByTestId("outer-popup")).not.toBeNull();
  });

  it("does not re-announce an open outer tooltip when the pending reopen fires", async () => {
    const delay = 30;
    const onOpenChange = vi.fn();
    const [open, setOpen] = createSignal(false);

    render(() => (
      <div>
        <button data-testid="open-outer" onClick={() => setOpen(true)} type="button" />
        <Tooltip.Provider delay={delay}>
          <Tooltip.Root
            open={open()}
            onOpenChange={(nextOpen, eventDetails) => {
              onOpenChange(nextOpen, eventDetails);
              setOpen(nextOpen);
            }}
          >
            <Tooltip.Trigger data-testid="outer-trigger" render="span">
              <span data-testid="outer-area">Outer</span>
              <Tooltip.Root>
                <Tooltip.Trigger data-testid="inner-trigger" delay={delay * 10}>
                  Inner
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });
    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);

    fireEvent.click(screen.getByTestId("open-outer"));
    await screen.findByTestId("outer-popup");

    await sleep(delay + 10);
    await flushMicrotasks();

    expect(screen.getByTestId("outer-popup")).not.toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("supports nested triggers inside a detached parent trigger", async () => {
    const delay = 30;
    const rowHandle = Tooltip.createHandle<string>();

    render(() => (
      <Tooltip.Provider delay={delay}>
        <Tooltip.Trigger handle={rowHandle} payload="Row" data-testid="outer-trigger" render="div">
          <span data-testid="outer-area">Row</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger" delay={0}>
              Inner
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>

        <Tooltip.Root handle={rowHandle}>
          {(state) => (
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="outer-popup">{state.payload} tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
      </Tooltip.Provider>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const outerArea = screen.getByTestId("outer-area");
    const innerTrigger = screen.getByTestId("inner-trigger");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });

    await sleep(delay + 10);
    await flushMicrotasks();
    expect(screen.getByTestId("inner-popup")).not.toBeNull();
    expect(screen.queryByTestId("outer-popup")).toBeNull();

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);

    await sleep(delay + 10);
    await flushMicrotasks();
    expect(screen.getByTestId("outer-popup")).toHaveTextContent("Row tooltip");
  });

  it("does not reopen the outer tooltip when rapidly moving back to a nested trigger", async () => {
    const delay = 30;

    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span" delay={delay}>
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });

    await sleep(delay + 10);
    await flushMicrotasks();

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);
    await sleep(delay / 2);

    fireEvent.mouseOut(outerArea, { relatedTarget: innerTrigger });
    fireEvent.mouseOver(innerTrigger);
    await sleep(delay / 2);
    await flushMicrotasks();

    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("does not reopen the outer tooltip when hovering the nested tooltip popup", async () => {
    const delay = 30;

    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span" delay={delay}>
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger" delay={0}>
              Inner
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });

    await sleep(delay + 10);
    await flushMicrotasks();

    const innerPopup = screen.getByTestId("inner-popup");
    expect(screen.queryByTestId("outer-popup")).toBeNull();

    fireEvent.mouseOver(innerPopup);
    await sleep(delay + 10);
    await flushMicrotasks();

    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("cancels the pending parent reopen when the pointer leaves the parent trigger", async () => {
    const delay = 30;

    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span" delay={delay}>
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });

    await sleep(delay + 10);
    await flushMicrotasks();

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);
    await sleep(delay / 2);
    fireEvent.mouseLeave(outerTrigger, { relatedTarget: document.body });

    await sleep(delay + 10);
    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("does not open the outer tooltip when the pointer moves onto a nested trigger before the delay expires", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");

    fireEvent.pointerDown(outerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(outerTrigger, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.mouseMove(outerTrigger, { clientX: 10, clientY: 10 });

    await sleep(DELAY / 2);
    fireEvent.pointerEnter(innerTrigger, { clientX: 50, clientY: 10 });
    fireEvent.pointerMove(innerTrigger, { clientX: 50, clientY: 10 });
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });

    await sleep(DELAY + 10);
    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("restarts the parent delay when moving from a nested trigger to the parent area", async () => {
    const delay = 30;

    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span" delay={delay}>
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger" delay={delay * 10}>
              Inner
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const outerArea = screen.getByTestId("outer-area");
    const innerTrigger = screen.getByTestId("inner-trigger");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.mouseMove(outerTrigger, { clientX: 10, clientY: 10 });
    await sleep(delay / 2);

    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);
    await sleep(delay / 2);
    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();

    await sleep(delay / 2 + 10);
    await flushMicrotasks();
    await screen.findByTestId("outer-popup");
    expect(screen.getByTestId("outer-popup")).not.toBeNull();
  });

  it("closes the outer tooltip when the pointer moves from outer area onto a nested trigger", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const outerArea = screen.getByTestId("outer-area");
    const innerTrigger = screen.getByTestId("inner-trigger");

    fireEvent.pointerDown(outerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(outerTrigger, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.mouseMove(outerTrigger, { clientX: 10, clientY: 10 });
    await screen.findByTestId("outer-popup");

    fireEvent.mouseOut(outerArea, { relatedTarget: innerTrigger });
    fireEvent.pointerEnter(innerTrigger, { clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    await flushMicrotasks();

    await waitFor(() => expect(screen.queryByTestId("outer-popup")).toBeNull());
  });

  it("keeps a focus-opened outer tooltip open when hovering over a nested trigger", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger
          data-testid="outer-trigger"
          render={(props) => <span {...props}>{props.children}</span>}
        >
          <span>Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger" delay={DELAY * 10}>
              Inner
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");

    if (!(outerTrigger instanceof HTMLElement)) throw new Error("Expected an HTML trigger");
    outerTrigger.setAttribute("tabindex", "0");
    outerTrigger.focus();
    await flushMicrotasks();
    expect(screen.getByTestId("outer-popup")).not.toBeNull();

    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });
    await sleep(DELAY + 10);
    await flushMicrotasks();

    expect(screen.getByTestId("outer-popup")).not.toBeNull();
  });

  it("keeps a controlled-open outer tooltip open when hovering over a nested trigger", async () => {
    const onOpenChange = vi.fn();

    render(() => (
      <Tooltip.Root open onOpenChange={onOpenChange}>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          <span>Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger" delay={DELAY * 10}>
              Inner
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const innerTrigger = screen.getByTestId("inner-trigger");
    expect(screen.getByTestId("outer-popup")).not.toBeNull();

    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });
    await sleep(DELAY + 10);
    await flushMicrotasks();

    expect(screen.getByTestId("outer-popup")).not.toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not open the outer tooltip when focusing a nested tooltip trigger", async () => {
    render(() => (
      <Tooltip.Provider delay={0}>
        <Tooltip.Root>
          <Tooltip.Trigger data-testid="outer-trigger" render="div">
            row label
            <Tooltip.Root>
              <Tooltip.Trigger data-testid="inner-trigger">button with tooltip</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="inner-popup">inner popup</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="outer-popup">outer popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    ));

    const innerTrigger = screen.getByTestId("inner-trigger");
    if (!(innerTrigger instanceof HTMLElement)) throw new Error("Expected an HTML trigger");
    innerTrigger.focus();
    await flushMicrotasks();

    expect(screen.getByTestId("inner-popup")).not.toBeNull();
    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("closes a focus-opened inner tooltip when the inner trigger loses focus", async () => {
    render(() => (
      <Tooltip.Provider delay={0}>
        <Tooltip.Root open={false}>
          <Tooltip.Trigger data-testid="outer-trigger" render="div">
            row label
            <Tooltip.Root>
              <Tooltip.Trigger data-testid="inner-trigger">button with tooltip</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="inner-popup">inner popup</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
            <button data-testid="after" type="button">
              button
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="outer-popup">outer popup</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    ));

    const innerTrigger = screen.getByTestId("inner-trigger");
    const after = screen.getByTestId("after");
    if (!(innerTrigger instanceof HTMLElement) || !(after instanceof HTMLElement)) {
      throw new Error("Expected HTML focus targets");
    }

    innerTrigger.focus();
    await flushMicrotasks();
    expect(screen.getByTestId("inner-popup")).not.toBeNull();

    after.focus();
    await sleep(DELAY + 10);
    await flushMicrotasks();
    await waitFor(() => expect(screen.queryByTestId("inner-popup")).toBeNull());
  });

  it("allows the parent tooltip to open when a nested trigger is disabled", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          Outer
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger" disabled>
              Inner (disabled)
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");

    fireEvent.pointerDown(outerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(outerTrigger, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });

    await sleep(DELAY + 10);
    await flushMicrotasks();
    await screen.findByTestId("outer-popup");
    expect(screen.getByTestId("outer-popup")).not.toBeNull();
    expect(screen.queryByTestId("inner-popup")).toBeNull();
  });

  it("does not open the outer tooltip when hovering over a nested trigger inside a shadow root", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const shadowRoot = host.attachShadow({ mode: "open" });
    const container = document.createElement("div");
    shadowRoot.appendChild(container);

    try {
      render(
        () => (
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="outer-trigger" render="span">
              Outer
              <Tooltip.Root>
                <Tooltip.Trigger data-testid="inner-trigger" render="div">
                  Inner
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ),
        { container },
      );

      const outerTrigger = shadowRoot.querySelector('[data-testid="outer-trigger"]');
      const innerTrigger = shadowRoot.querySelector('[data-testid="inner-trigger"]');
      if (!(outerTrigger instanceof HTMLElement) || !(innerTrigger instanceof HTMLElement)) {
        throw new Error("Expected shadow-root triggers");
      }
      const innerShadowRoot = innerTrigger.attachShadow({ mode: "open" });
      const innerShadowTarget = document.createElement("span");
      innerShadowTarget.textContent = "Inner shadow target";
      innerShadowRoot.appendChild(innerShadowTarget);

      fireEvent.pointerDown(outerTrigger, { pointerType: "mouse" });
      fireEvent.pointerEnter(outerTrigger, { clientX: 10, clientY: 10 });
      fireEvent.mouseEnter(outerTrigger);
      fireEvent.mouseMove(outerTrigger, { clientX: 10, clientY: 10 });

      fireEvent.pointerEnter(innerTrigger, { clientX: 50, clientY: 10 });
      fireEvent.mouseEnter(innerTrigger);
      innerShadowTarget.dispatchEvent(
        new MouseEvent("mouseover", {
          bubbles: true,
          composed: true,
          clientX: 50,
          clientY: 10,
        }),
      );
      fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });

      await sleep(DELAY + 10);
      await flushMicrotasks();
      expect(screen.queryByTestId("outer-popup")).toBeNull();
    } finally {
      host.remove();
    }
  });

  it.each([
    {
      name: "starts with a ShadowRoot",
      getPath(this: void, innerTrigger: HTMLElement, outerTrigger: HTMLElement) {
        const shadowRoot = document.createElement("div").attachShadow({ mode: "open" });
        return [shadowRoot, innerTrigger, outerTrigger, document.body, document, window];
      },
    },
    {
      name: "is empty",
      getPath(this: void) {
        return [];
      },
    },
  ])("handles a composed path that $name", async ({ getPath }) => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          Outer
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    if (!(outerTrigger instanceof HTMLElement) || !(innerTrigger instanceof HTMLElement)) {
      throw new Error("Expected HTML triggers");
    }

    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse" });
    fireEvent.mouseEnter(outerTrigger);

    const mouseOverEvent = new MouseEvent("mouseover", { bubbles: true, composed: true });
    Object.defineProperty(mouseOverEvent, "composedPath", {
      value: () => getPath(innerTrigger, outerTrigger),
    });
    innerTrigger.dispatchEvent(mouseOverEvent);

    await sleep(DELAY + 10);
    await flushMicrotasks();
    await waitFor(() => expect(screen.queryByTestId("outer-popup")).toBeNull());
  });

  it("opens the outer tooltip when hovering over the non-nested area", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    fireEvent.pointerDown(outerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(outerTrigger, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.mouseMove(outerTrigger, { clientX: 10, clientY: 10 });

    await sleep(DELAY + 10);
    await flushMicrotasks();
    await screen.findByTestId("outer-popup");
    expect(screen.getByTestId("outer-popup")).not.toBeNull();
    expect(screen.queryByTestId("inner-popup")).toBeNull();
  });

  it("does not reopen the outer tooltip via the local reopen path for touch pointers", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span" delay={0}>
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "touch", clientX: 10, clientY: 10 });
    fireEvent.pointerEnter(innerTrigger, { pointerType: "touch", clientX: 50, clientY: 10 });
    fireEvent.mouseOver(innerTrigger);
    await flushMicrotasks();

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);
    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("allows mouse hover after leaving a touch interaction", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span" delay={0}>
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");

    fireEvent.pointerEnter(outerTrigger, { pointerType: "touch", clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(outerTrigger, { relatedTarget: document.body });
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);

    await flushMicrotasks();
    expect(screen.getByTestId("outer-popup")).not.toBeNull();
  });

  it("does not open the outer tooltip when moving from the outer popup to a nested trigger", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger" delay={DELAY * 10}>
              Inner
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    fireEvent.pointerDown(outerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(outerTrigger, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.mouseMove(outerTrigger, { clientX: 10, clientY: 10 });
    const outerPopup = await screen.findByTestId("outer-popup");

    fireEvent.pointerEnter(outerPopup, { pointerType: "mouse", clientX: 200, clientY: 200 });
    fireEvent.mouseOver(outerPopup);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    await flushMicrotasks();

    await waitFor(() => expect(screen.queryByTestId("outer-popup")).toBeNull());
  });

  it("suppresses the safePolygon-driven open while a nested trigger is hovered", async () => {
    render(() => (
      <Tooltip.Root>
        <Tooltip.Trigger data-testid="outer-trigger" render="span">
          <span data-testid="outer-area">Outer</span>
          <Tooltip.Root>
            <Tooltip.Trigger data-testid="inner-trigger" delay={DELAY * 10}>
              Inner
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    fireEvent.pointerDown(outerTrigger, { pointerType: "mouse" });
    fireEvent.pointerEnter(outerTrigger, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.mouseMove(outerTrigger, { clientX: 10, clientY: 10 });
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    fireEvent.mouseMove(innerTrigger, { clientX: 50, clientY: 10 });
    fireEvent.mouseMove(innerTrigger, { clientX: 51, clientY: 10 });

    await sleep(DELAY + 10);
    await flushMicrotasks();
    expect(screen.queryByTestId("outer-popup")).toBeNull();
  });

  it("supports nested triggers with a Provider delay={0}", async () => {
    render(() => (
      <Tooltip.Provider delay={0}>
        <Tooltip.Root>
          <Tooltip.Trigger data-testid="outer-trigger" render="span">
            <span data-testid="outer-area">Outer</span>
            <Tooltip.Root>
              <Tooltip.Trigger data-testid="inner-trigger">Inner</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="inner-popup">Inner tooltip</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid="outer-popup">Outer tooltip</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    ));

    const outerTrigger = screen.getByTestId("outer-trigger");
    const innerTrigger = screen.getByTestId("inner-trigger");
    const outerArea = screen.getByTestId("outer-area");
    fireEvent.pointerEnter(outerTrigger, { pointerType: "mouse", clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(outerTrigger);
    fireEvent.pointerEnter(innerTrigger, { pointerType: "mouse", clientX: 50, clientY: 10 });
    fireEvent.mouseEnter(innerTrigger);
    fireEvent.mouseOver(innerTrigger);
    await sleep(1);
    await flushMicrotasks();

    expect(screen.queryByTestId("outer-popup")).toBeNull();
    await screen.findByTestId("inner-popup");
    expect(screen.getByTestId("inner-popup")).not.toBeNull();

    fireEvent.mouseOut(innerTrigger, { relatedTarget: outerArea });
    fireEvent.mouseOver(outerArea);
    await flushMicrotasks();
    expect(screen.getByTestId("outer-popup")).not.toBeNull();
  });
});
