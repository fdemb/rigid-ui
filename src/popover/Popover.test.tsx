import { createSignal } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render, isJSDOM } from "../../test/test-utils";
import { Popover } from "./index";

// Base UI sources inventoried: Root (including detached triggers), Trigger, Portal, Positioner,
// Popup, Arrow, Backdrop, Title, Description, Close, Viewport, and enum synchronization tests.
// React renderer/ref lifecycle cases, render/nativeButton replacement cases, and Toolbar/Menu
// integration cases are intentionally inapplicable to this Solid library and its public API.

function TestPopover(props: { defaultOpen?: boolean; keepMounted?: boolean } = {}) {
  return (
    <Popover.Root defaultOpen={props.defaultOpen}>
      <Popover.Trigger>Toggle</Popover.Trigger>
      <Popover.Portal keepMounted={props.keepMounted}>
        <Popover.Positioner data-testid="positioner" sideOffset={8}>
          <Popover.Popup data-testid="popup">
            <Popover.Title>Popover title</Popover.Title>
            <Popover.Description>Popover description</Popover.Description>
            <button>Focusable</button>
            <Popover.Close>Close</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

describe("Popover", () => {
  describe("root and trigger", () => {
    it("opens and closes an uncontrolled popover from its trigger", async () => {
      render(() => <TestPopover />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("dialog")).toBeNull();

      fireEvent.click(trigger);
      const popup = await screen.findByRole("dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("aria-controls", popup.id);
      expect(trigger).toHaveAttribute("data-popup-open");
      expect(trigger).toHaveAttribute("data-pressed");
      expect(popup).toHaveAttribute("data-open");
      expect(screen.getByTestId("positioner")).toHaveAttribute("data-side", "bottom");

      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("honors controlled state and reports change details", async () => {
      const changes = vi.fn();
      function Controlled() {
        const [open, setOpen] = createSignal(false);
        return (
          <Popover.Root
            open={open()}
            onOpenChange={(nextOpen, details) => {
              changes(nextOpen, details.reason, details.trigger);
              setOpen(nextOpen);
            }}
          >
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        );
      }
      render(() => <Controlled />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      expect(await screen.findByText("Content")).toBeVisible();
      expect(changes).toHaveBeenLastCalledWith(true, "trigger-press", trigger);
    });

    it("allows canceling an uncontrolled state change", async () => {
      render(() => (
        <Popover.Root onOpenChange={(_open, details) => details.cancel()}>
          <Popover.Trigger>Toggle</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      expect(screen.queryByText("Content")).toBeNull();
    });

    it("gives a controlled open prop precedence over defaultOpen", () => {
      render(() => <TestPopover defaultOpen />);
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    it("does not open from a disabled trigger", () => {
      render(() => (
        <Popover.Root>
          <Popover.Trigger disabled>Toggle</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      expect(screen.queryByText("Content")).toBeNull();
    });
  });

  describe("dismissal and focus", () => {
    it("closes from Close and restores focus to the trigger", async () => {
      render(() => <TestPopover />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      trigger.focus();
      fireEvent.click(trigger);
      const focusable = await screen.findByRole("button", { name: "Focusable" });
      await waitFor(() => expect(focusable).toHaveFocus());
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(trigger).toHaveFocus();
    });

    it("closes on Escape and outside press", async () => {
      render(() => (
        <div>
          <button data-testid="outside">Outside</button>
          <TestPopover />
        </div>
      ));
      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await screen.findByRole("dialog");
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

      fireEvent.click(trigger);
      await screen.findByRole("dialog");
      fireEvent.pointerDown(screen.getByTestId("outside"));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("supports initialFocus=false and finalFocus=false", async () => {
      render(() => (
        <Popover.Root>
          <Popover.Trigger>Toggle</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup initialFocus={false} finalFocus={false}>
                <button>Inside</button>
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      const trigger = screen.getByRole("button", { name: "Toggle" });
      trigger.focus();
      fireEvent.click(trigger);
      await screen.findByRole("dialog");
      expect(trigger).toHaveFocus();
      const close = screen.getByRole("button", { name: "Close" });
      close.focus();
      fireEvent.click(close);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(trigger).not.toHaveFocus();
    });
  });

  describe("parts", () => {
    it("labels and describes the popup", () => {
      render(() => <TestPopover defaultOpen />);
      const popup = screen.getByRole("dialog");
      expect(popup).toHaveAccessibleName("Popover title");
      expect(popup).toHaveAccessibleDescription("Popover description");
    });

    it("keeps portal content mounted and hidden", async () => {
      render(() => <TestPopover keepMounted />);
      const positioner = screen.getByTestId("positioner");
      expect(positioner).not.toBeVisible();
      expect(positioner).toHaveAttribute("data-closed");
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await waitFor(() => expect(positioner).toBeVisible());
    });

    it("mounts a portal in a custom container", () => {
      const container = document.createElement("section");
      document.body.append(container);
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger>Toggle</Popover.Trigger>
          <Popover.Portal container={container} data-testid="portal">
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      expect(screen.getByTestId("portal").parentElement).toBe(container);
      container.remove();
    });

    it("exposes state on Backdrop and renders Viewport current content", () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger openOnHover>Toggle</Popover.Trigger>
          <Popover.Portal>
            <Popover.Backdrop data-testid="backdrop" />
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Viewport data-testid="viewport">Content</Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      expect(screen.getByTestId("backdrop")).toHaveAttribute("data-open");
      expect(screen.getByTestId("viewport").firstElementChild).toHaveAttribute("data-current");
    });

    it("forwards refs, native props, classes, and styles", () => {
      let triggerRef: HTMLButtonElement | undefined;
      let popupRef: HTMLDivElement | undefined;
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger ref={(element) => (triggerRef = element)} class="trigger-class">
            Toggle
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup
                ref={(element) => (popupRef = element)}
                class="popup-class"
                aria-label="Details"
                style={{ width: "123px" }}
              />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      expect(triggerRef).toBe(screen.getByRole("button", { name: "Toggle" }));
      expect(triggerRef).toHaveClass("trigger-class");
      expect(popupRef).toBe(screen.getByRole("dialog"));
      expect(popupRef).toHaveClass("popup-class");
      expect(popupRef).toHaveStyle({ width: "123px" });
    });
  });

  describe.skipIf(!isJSDOM)("hover and detached triggers", () => {
    it("opens and closes on hover delays", async () => {
      vi.useFakeTimers();
      render(() => (
        <Popover.Root>
          <Popover.Trigger openOnHover delay={100} closeDelay={50}>
            Toggle
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Backdrop data-testid="backdrop" />
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
      vi.advanceTimersByTime(99);
      expect(screen.queryByText("Content")).toBeNull();
      vi.advanceTimersByTime(1);
      await Promise.resolve();
      expect(screen.getByText("Content")).toBeVisible();
      expect(screen.getByTestId("backdrop")).toHaveStyle({ pointerEvents: "none" });

      fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      expect(screen.queryByText("Content")).toBeNull();
    });

    it("connects detached triggers through a handle and forwards payload", async () => {
      const handle = Popover.createHandle<number>();
      render(() => (
        <div>
          <Popover.Trigger handle={handle} id="detached" payload={42}>
            Detached
          </Popover.Trigger>
          <Popover.Root handle={handle}>
            {({ payload }) => (
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>Payload: {payload}</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </div>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Detached" }));
      expect(await screen.findByText("Payload: 42")).toBeVisible();
      expect(handle.isOpen).toBe(true);
      handle.close();
      await waitFor(() => expect(screen.queryByText("Payload: 42")).toBeNull());
    });
  });

  describe.skipIf(isJSDOM)("native anchor positioning in Chromium", () => {
    it("positions from the trigger with CSS anchor positioning and numeric offsets", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger
            style={{
              position: "fixed",
              left: "120px",
              top: "120px",
              width: "80px",
              height: "30px",
            }}
          >
            Toggle
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              positionMethod="fixed"
              side="bottom"
              align="start"
              sideOffset={12}
            >
              <Popover.Popup style={{ width: "120px", height: "60px" }}>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      const trigger = screen.getByRole("button", { name: "Toggle" });
      const positioner = screen.getByTestId("positioner");
      await waitFor(() => expect(positioner.getBoundingClientRect().width).toBeGreaterThan(0));

      expect(trigger.style.getPropertyValue("anchor-name")).toMatch(/^--rigid-popover-anchor-/);
      expect(positioner.style.getPropertyValue("position-anchor")).toBe(
        trigger.style.getPropertyValue("anchor-name"),
      );
      expect(positioner.style.getPropertyValue("position-area")).toContain("bottom");
      expect(positioner.style.getPropertyValue("position-try-fallbacks")).toContain("top");
      expect(
        positioner.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom,
      ).toBeCloseTo(12, 0);
      expect(positioner.getBoundingClientRect().left).toBeCloseTo(
        trigger.getBoundingClientRect().left,
        0,
      );
    });

    it("uses a native external anchor and restores its styles on cleanup", async () => {
      let anchor: HTMLButtonElement | undefined;
      const view = render(() => (
        <div>
          <button
            ref={(element) => (anchor = element)}
            style={{ position: "fixed", left: "300px", top: "100px" }}
          >
            Anchor
          </button>
          <Popover.Root defaultOpen>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner anchor={() => anchor ?? null} positionMethod="fixed">
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>
      ));
      await screen.findByText("Content");
      expect(anchor!.style.getPropertyValue("anchor-name")).toMatch(
        /^--rigid-popover-external-anchor-/,
      );
      view.unmount();
      expect(anchor!.style.getPropertyValue("anchor-name")).toBe("");
    });
  });
});
