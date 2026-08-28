import { createSignal } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { isJSDOM, render, resetBrowserPointer } from "../../../test/test-utils";
import { Tooltip } from "../index";

// Ported from Base UI's `tooltip/root/TooltipRoot.test.tsx` (single-tooltip subset; the
// nested-trigger choreography and cursor-tracking clusters are tracked as RUI-49 and RUI-48).
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
        <Tooltip.Positioner>
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
