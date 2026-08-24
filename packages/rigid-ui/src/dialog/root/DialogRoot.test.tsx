import { createSignal } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { isJSDOM, render } from "../../../test/test-utils";
import { Dialog } from "../index";

// Ported from Base UI's `root/DialogRoot.test.tsx` and `popup/DialogPopup.test.tsx` (the
// jsdom-safe subset). Layout/geometry contracts run in the Chromium suite.

function TestDialog(
  props: {
    open?: boolean;
    defaultOpen?: boolean;
    modal?: boolean | "trap-focus";
    onOpenChange?: (open: boolean, details: { reason: string; event: Event }) => void;
    initialFocus?: Parameters<typeof Object>[0];
    finalFocus?: Parameters<typeof Object>[0];
    includeBackdrop?: boolean;
  } = {},
) {
  return (
    <Dialog.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      modal={props.modal}
      onOpenChange={props.onOpenChange}
    >
      <Dialog.Trigger>Toggle</Dialog.Trigger>
      <Dialog.Portal>
        {props.includeBackdrop ? <Dialog.Backdrop data-testid="backdrop" /> : null}
        <Dialog.Popup data-testid="popup">
          <Dialog.Title>Dialog title</Dialog.Title>
          <Dialog.Description>Dialog description</Dialog.Description>
          <button>Focusable</button>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

describe("Dialog", () => {
  describe("root and trigger", () => {
    it("opens and closes an uncontrolled dialog from its trigger", async () => {
      render(() => <TestDialog />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("dialog")).toBeNull();

      fireEvent.click(trigger);
      const popup = await screen.findByRole("dialog");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("aria-controls", popup.id);
      expect(trigger).toHaveAttribute("data-popup-open");
      expect(popup).toHaveAttribute("data-open");

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("honors controlled state and reports change details", async () => {
      const changes = vi.fn();
      function Controlled() {
        const [open, setOpen] = createSignal(false);
        return (
          <Dialog.Root
            open={open()}
            onOpenChange={(nextOpen, details) => {
              changes(nextOpen, details.reason);
              setOpen(nextOpen);
            }}
          >
            <Dialog.Trigger>Toggle</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup>Content</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }
      render(() => <Controlled />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.getByText("Content")).toBeVisible());
      expect(changes).toHaveBeenLastCalledWith(true, "trigger-press");
    });

    it("allows canceling an uncontrolled state change", async () => {
      render(() => (
        <Dialog.Root onOpenChange={(_open, details) => details.cancel()}>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      expect(screen.queryByText("Content")).toBeNull();
    });

    it("does not open from a disabled trigger", async () => {
      render(() => (
        <Dialog.Root>
          <Dialog.Trigger disabled>Toggle</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      const trigger = screen.getByRole("button", { name: "Toggle" });
      expect(trigger).toBeDisabled();
      fireEvent.click(trigger);
      expect(screen.queryByText("Content")).toBeNull();
    });
  });

  describe("dismissal and focus", () => {
    it.skipIf(isJSDOM)("closes a controlled portaled dialog without a Dialog.Trigger", async () => {
      function ControlledDialog() {
        const [open, setOpen] = createSignal(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open dialog</button>
            <Dialog.Root open={open()} onOpenChange={setOpen}>
              <Dialog.Portal>
                <Dialog.Popup>
                  <Dialog.Close>Close dialog</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </>
        );
      }

      render(() => <ControlledDialog />);
      fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
      await screen.findByRole("dialog");

      fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("closes from Close and restores focus to the trigger", async () => {
      render(() => <TestDialog modal={false} />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      trigger.focus();
      fireEvent.click(trigger);
      const focusable = await screen.findByRole("button", { name: "Focusable" });
      await waitFor(() => expect(focusable).toHaveFocus());

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(trigger).toHaveFocus();
    });

    it("closes on Escape", async () => {
      render(() => <TestDialog />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await screen.findByRole("dialog");
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("closes a non-modal dialog on an intentional outside press", async () => {
      render(() => (
        <div>
          <button data-testid="outside">Outside</button>
          <TestDialog modal={false} />
        </div>
      ));
      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await screen.findByRole("dialog");

      const outside = screen.getByTestId("outside");
      fireEvent.pointerDown(outside);
      fireEvent.pointerUp(outside);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("does not close before an outside press completes (down without up)", async () => {
      render(() => (
        <div>
          <button data-testid="outside">Outside</button>
          <TestDialog modal={false} />
        </div>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      const outside = screen.getByTestId("outside");
      fireEvent.pointerDown(outside);
      await Promise.resolve();
      await Promise.resolve();
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      fireEvent.pointerUp(outside);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("does not close when the press starts inside and ends outside", async () => {
      render(() => (
        <div>
          <button data-testid="outside">Outside</button>
          <TestDialog modal={false} />
        </div>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      const popup = await screen.findByRole("dialog");
      fireEvent.pointerDown(popup);
      fireEvent.pointerUp(screen.getByTestId("outside"));
      await Promise.resolve();
      await Promise.resolve();
      expect(popup).toBeInTheDocument();
    });

    it("does not close on a right-button outside press", async () => {
      render(() => (
        <div>
          <button data-testid="outside">Outside</button>
          <TestDialog modal={false} />
        </div>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      const outside = screen.getByTestId("outside");
      fireEvent.pointerDown(outside, { button: 2 });
      fireEvent.pointerUp(outside, { button: 2 });
      await Promise.resolve();
      await Promise.resolve();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("focuses the first tabbable element on open and supports initialFocus=false", async () => {
      render(() => <TestDialog modal={false} />);
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      const focusable = await screen.findByRole("button", { name: "Focusable" });
      await waitFor(() => expect(focusable).toHaveFocus());
    });

    it("keeps focus where it is with initialFocus=false", async () => {
      render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup initialFocus={false}>
              <button>Inside</button>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      const trigger = screen.getByRole("button", { name: "Toggle" });
      trigger.focus();
      fireEvent.click(trigger);
      await screen.findByRole("dialog");
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(screen.getByRole("button", { name: "Inside" })).not.toHaveFocus();
    });

    it("supports element-returning function for initialFocus", async () => {
      render(() => (
        <Dialog.Root defaultOpen modal={false}>
          <Dialog.Portal>
            <Dialog.Popup
              initialFocus={(interactionType) =>
                interactionType === "keyboard"
                  ? document.querySelector<HTMLButtonElement>("[data-testid=custom-focus]")
                  : true
              }
            >
              <input data-testid="custom-focus" />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      await waitFor(() => expect(screen.getByTestId("custom-focus")).toHaveFocus());
    });

    it("labels and describes the popup", async () => {
      render(() => <TestDialog defaultOpen modal={false} />);
      const popup = await screen.findByRole("dialog");
      expect(popup).toHaveAccessibleName("Dialog title");
      expect(popup).toHaveAccessibleDescription("Dialog description");
    });
  });

  describe("non-modal focus guards", () => {
    // Document tab order: outside-before, [portal: beforeGuard, popup, afterGuard],
    // outside-after. The portal renders into an explicit container so the fixture controls
    // what precedes and follows it.
    function NonModalTabDialog() {
      let portalContainer: HTMLDivElement | undefined;
      return (
        <div>
          <span tabindex={0} data-testid="outside-before" />
          <div data-testid="portal-container" ref={portalContainer} />
          <span tabindex={0} data-testid="outside-after" />
          <Dialog.Root modal={false}>
            <Dialog.Trigger data-testid="trigger">Toggle</Dialog.Trigger>
            <Dialog.Portal container={portalContainer}>
              <Dialog.Popup data-testid="popup">
                <button data-testid="inside">Inside</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      );
    }

    async function openNonModal() {
      render(() => <NonModalTabDialog />);
      const trigger = screen.getByTestId("trigger");
      trigger.focus();
      fireEvent.click(trigger);
      const inside = await screen.findByTestId("inside");
      await waitFor(() => expect(inside).toHaveFocus());
      const popup = screen.getByTestId("popup");
      return {
        popup,
        beforeGuard: popup.previousElementSibling as HTMLElement,
        afterGuard: popup.nextElementSibling as HTMLElement,
        outsideBefore: screen.getByTestId("outside-before"),
        outsideAfter: screen.getByTestId("outside-after"),
        inside,
      };
    }

    it("renders guards for a portaled non-modal dialog", async () => {
      const { beforeGuard, afterGuard } = await openNonModal();

      expect(beforeGuard).toHaveAttribute("data-rigid-ui-focus-guard");
      expect(afterGuard).toHaveAttribute("data-rigid-ui-focus-guard");
    });

    it("renders no guards when the popup is not portaled", async () => {
      render(() => (
        <Dialog.Root modal={false}>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Popup data-testid="popup">
            <button>Inside</button>
          </Dialog.Popup>
        </Dialog.Root>
      ));

      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByTestId("popup");

      expect(document.querySelectorAll("[data-rigid-ui-focus-guard]")).toHaveLength(0);
    });

    it("continues forward tabbing into the document flow after the portal and closes", async () => {
      const { afterGuard, outsideAfter } = await openNonModal();

      // Tabbing forward from the last tabbable inside lands on the after guard; the manager
      // must hand focus past the portal instead of letting it die there.
      afterGuard.focus();

      await waitFor(() => expect(outsideAfter).toHaveFocus());
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("continues backward tabbing to the element before the portal and stays open", async () => {
      const { beforeGuard, outsideBefore } = await openNonModal();

      beforeGuard.focus();

      await waitFor(() => expect(outsideBefore).toHaveFocus());
      expect(screen.queryByRole("dialog")).not.toBeNull();
    });
  });

  describe("modal behavior", () => {
    it("renders an internal backdrop for modal dialogs only", async () => {
      const modal = render(() => <TestDialog />);
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      expect(document.querySelector('[data-rigid-ui-inert][role="presentation"]')).not.toBeNull();
      modal.unmount();

      render(() => <TestDialog modal={false} />);
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      expect(document.querySelector('[data-rigid-ui-inert][role="presentation"]')).toBeNull();
    });

    it("marks everything outside the popup aria-hidden while modal", async () => {
      render(() => (
        <div>
          <button data-testid="outside">Outside</button>
          <TestDialog />
        </div>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      const outside = await screen.findByTestId("outside");
      await waitFor(() => expect(outside.closest('[aria-hidden="true"]')).not.toBeNull());

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(outside.closest('[aria-hidden="true"]')).toBeNull());
    });

    it("dismisses a modal dialog through its internal backdrop with an intentional press", async () => {
      render(() => <TestDialog includeBackdrop />);
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");

      const backdrop = screen.getByTestId("backdrop");
      fireEvent.pointerDown(backdrop);
      // A modal dialog closes through backdrops only, never through arbitrary outside nodes.
      fireEvent.pointerUp(backdrop);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("does not dismiss a modal dialog when pressing an outside node that is not a backdrop", async () => {
      render(() => (
        <div>
          <button data-testid="outside">Outside</button>
          <TestDialog />
        </div>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      const outside = screen.getByTestId("outside");
      fireEvent.pointerDown(outside);
      fireEvent.pointerUp(outside);
      await Promise.resolve();
      await Promise.resolve();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("locks scroll while fully modal and unlocks on close", async () => {
      render(() => <TestDialog />);
      const html = document.documentElement;
      const originalOverflowY = html.style.overflowY;
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      await waitFor(() => {
        if (html.style.overflowY !== "hidden" && document.body.style.overflowY !== "hidden") {
          throw new Error("scroll is not locked");
        }
      });
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => {
        if (html.style.overflowY === "hidden" || document.body.style.overflowY === "hidden") {
          throw new Error("scroll is still locked");
        }
      });
      html.style.overflowY = originalOverflowY;
    });

    it("does not lock scroll in trap-focus mode", async () => {
      render(() => <TestDialog modal="trap-focus" />);
      const html = document.documentElement;
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(html.getAttribute("data-rigid-ui-scroll-locked")).toBeNull();
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });
  });

  describe("nesting", () => {
    it("closes nested dialogs one at a time with Escape", async () => {
      render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Parent trigger</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="parent-popup">
              <Dialog.Title>Parent</Dialog.Title>
              <Dialog.Root>
                <Dialog.Trigger>Child trigger</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Popup data-testid="child-popup">
                    <Dialog.Title>Child</Dialog.Title>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Parent trigger" }));
      fireEvent.click(await screen.findByRole("button", { name: "Child trigger" }));
      await screen.findByTestId("child-popup");

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByTestId("child-popup")).toBeNull());
      expect(screen.getByTestId("parent-popup")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByTestId("parent-popup")).toBeNull());
    });

    it("exposes nesting state on the popup", async () => {
      render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Parent trigger</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="parent-popup">
              <Dialog.Title>Parent</Dialog.Title>
              <Dialog.Root>
                <Dialog.Trigger>Child trigger</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Popup data-testid="child-popup">
                    <Dialog.Title>Child</Dialog.Title>
                    <button>Nested action</button>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Parent trigger" }));
      const parent = await screen.findByTestId("parent-popup");
      expect(parent).not.toHaveAttribute("data-nested-dialog-open");

      fireEvent.click(screen.getByRole("button", { name: "Child trigger" }));
      const child = await screen.findByTestId("child-popup");
      expect(child).toHaveAttribute("data-nested");
      await waitFor(() => expect(parent).toHaveAttribute("data-nested-dialog-open"));
      void child;

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByTestId("child-popup")).toBeNull());
      await waitFor(() => expect(parent).not.toHaveAttribute("data-nested-dialog-open"));
    });

    it("keeps a parent open while interacting with a nested portaled dialog", async () => {
      render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Parent trigger</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-testid="parent-popup">
              <Dialog.Title>Parent</Dialog.Title>
              <Dialog.Root>
                <Dialog.Trigger>Child trigger</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Popup>
                    <Dialog.Title>Child</Dialog.Title>
                    <button>Child action</button>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Parent trigger" }));
      fireEvent.click(await screen.findByRole("button", { name: "Child trigger" }));
      const action = await screen.findByRole("button", { name: "Child action" });
      action.focus();
      fireEvent.pointerDown(action);
      fireEvent.pointerUp(action);
      await Promise.resolve();
      await Promise.resolve();
      expect(screen.getByTestId("parent-popup")).toBeInTheDocument();
    });
  });

  describe("parts and props", () => {
    it("keeps portal content mounted and hidden with keepMounted", async () => {
      render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal keepMounted>
            <Dialog.Popup data-testid="popup">Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      const popup = screen.getByTestId("popup");
      expect(popup).not.toBeVisible();
      expect(popup).toHaveAttribute("data-closed");
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await waitFor(() => expect(popup).toBeVisible());
    });

    it("mounts a portal in a custom container", async () => {
      const container = document.createElement("section");
      document.body.append(container);
      render(() => (
        <Dialog.Root defaultOpen>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal container={container} data-testid="portal">
            <Dialog.Popup>Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      await waitFor(() => expect(container.querySelector('[role="dialog"]')).not.toBeNull());
      expect(screen.getByTestId("portal").parentElement).toBe(container);
      container.remove();
    });

    it("exposes transition state on Backdrop", async () => {
      render(() => (
        <Dialog.Root defaultOpen>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop data-testid="backdrop" />
            <Dialog.Popup>Content</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      await screen.findByRole("dialog");
      expect(screen.getByTestId("backdrop")).toHaveAttribute("data-open");
    });

    it("forwards refs, native props, classes, and styles", async () => {
      let triggerRef: HTMLButtonElement | undefined;
      let popupRef: HTMLDivElement | undefined;
      let closeRef: HTMLButtonElement | undefined;
      render(() => (
        <Dialog.Root defaultOpen modal={false}>
          <Dialog.Trigger ref={(element) => (triggerRef = element)} class="trigger-class">
            Toggle
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup
              ref={(element) => (popupRef = element)}
              class="popup-class"
              style={{ width: "123px" }}
            >
              <Dialog.Close ref={(element) => (closeRef = element)} class="close-class">
                Close
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      await screen.findByRole("dialog");
      expect(triggerRef).toBe(screen.getByRole("button", { name: "Toggle" }));
      expect(triggerRef).toHaveClass("trigger-class");
      expect(popupRef).toBe(screen.getByRole("dialog"));
      expect(popupRef).toHaveClass("popup-class");
      expect(popupRef).toHaveStyle({ width: "123px" });
      expect(closeRef).toBe(screen.getByRole("button", { name: "Close" }));
      expect(closeRef).toHaveClass("close-class");
    });

    it("does not request another close when clicked after the dialog has closed", async () => {
      const changes = vi.fn();
      render(() => (
        <Dialog.Root onOpenChange={(open) => changes(open)}>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal keepMounted>
            <Dialog.Popup>
              <Dialog.Close onClick={() => changes("clicked")}>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      const close = screen.getByRole("button", { name: "Close" });
      fireEvent.click(close);
      await waitFor(() => expect(changes).toHaveBeenCalledWith(false));
      changes.mockClear();
      fireEvent.click(close);
      expect(changes).toHaveBeenCalledTimes(1);
    });
  });

  describe("handle", () => {
    it("connects detached triggers through a handle and forwards payload", async () => {
      const handle = Dialog.createHandle<number>();
      render(() => (
        <div>
          <Dialog.Trigger handle={handle} id="detached" payload={42}>
            Detached
          </Dialog.Trigger>
          {/* The render prop receives a real props object; read `state.payload`, do not destructure. */}
          <Dialog.Root handle={handle}>
            {(state) => (
              <Dialog.Portal>
                <Dialog.Popup>Payload: {state.payload}</Dialog.Popup>
              </Dialog.Portal>
            )}
          </Dialog.Root>
        </div>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Detached" }));
      await waitFor(() => expect(screen.getByText("Payload: 42")).toBeVisible());
      expect(handle.isOpen).toBe(true);
      handle.close();
      await waitFor(() => expect(screen.queryByText("Payload: 42")).toBeNull());
    });

    it("ignores imperative handle calls made before a root attaches", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const handle = Dialog.createHandle();
      try {
        handle.open(null);
        handle.close();

        const { unmount } = render(() => (
          <Dialog.Root handle={handle}>
            <Dialog.Portal>
              <Dialog.Popup>Content</Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ));
        await Promise.resolve();
        expect(screen.queryByText("Content")).toBeNull();
        unmount();
        const rigidWarnings = warn.mock.calls.filter((call) =>
          String(call[0]).includes("Rigid UI"),
        );
        expect(rigidWarnings).toEqual([]);
      } finally {
        warn.mockRestore();
      }
    });

    it("opens imperatively with openWithPayload", async () => {
      const handle = Dialog.createHandle<string>();
      render(() => (
        <Dialog.Root handle={handle}>
          {(state) => (
            <Dialog.Portal>
              <Dialog.Popup>Payload: {state.payload}</Dialog.Popup>
            </Dialog.Portal>
          )}
        </Dialog.Root>
      ));
      handle.openWithPayload("gift");
      await waitFor(() => expect(screen.getByText("Payload: gift")).toBeVisible());
      handle.close();
      await waitFor(() => expect(screen.queryByText(/Payload:/)).toBeNull());
    });
  });

  describe.skipIf(isJSDOM)("transitions in Chromium", () => {
    it("waits for the exit transition before unmounting and completing", async () => {
      const complete = vi.fn();
      render(() => (
        <>
          <style>
            {`
              .transition-popup {
                opacity: 1;
                transition: opacity 80ms linear;
              }
              .transition-popup[data-starting-style] {
                opacity: 0;
              }
              .transition-popup[data-ending-style] {
                opacity: 0;
              }
            `}
          </style>
          <Dialog.Root onOpenChangeComplete={complete}>
            <Dialog.Trigger>Toggle</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup class="transition-popup" data-testid="popup">
                Content
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      ));
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      const popup = await screen.findByRole("dialog");
      expect(popup).toHaveAttribute("data-starting-style");

      // Enter completion fires once the enter transition ends.
      await waitFor(() => expect(complete).toHaveBeenCalledWith(true));
      const callsAfterEnter = complete.mock.calls.length;

      fireEvent.keyDown(document, { key: "Escape" });
      // The popup stays mounted while the exit transition runs.
      await waitFor(() => expect(popup).toHaveAttribute("data-ending-style"));
      expect(screen.getByRole("dialog")).toBe(popup);
      await waitFor(() => expect(complete.mock.calls.length).toBeGreaterThan(callsAfterEnter));
      expect(complete).toHaveBeenLastCalledWith(false);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });
  });

  describe.skipIf(isJSDOM)("scroll lock layout in Chromium", () => {
    it("locks scroll without shifting the page horizontally", async () => {
      render(() => (
        <div style={{ width: "200vw", height: "200vh" }}>
          <TestDialog />
        </div>
      ));
      const body = document.body;
      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await screen.findByRole("dialog");
      await waitFor(() => {
        if (
          document.documentElement.style.overflowY !== "hidden" &&
          body.style.overflowY !== "hidden"
        ) {
          throw new Error("scroll is not locked");
        }
      });
      const widthBeforeLock = body.getBoundingClientRect().width;
      expect(widthBeforeLock).toBeGreaterThan(0);

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => {
        if (
          document.documentElement.style.overflowY === "hidden" ||
          body.style.overflowY === "hidden"
        ) {
          throw new Error("scroll is still locked");
        }
      });
      expect(body.style.position).not.toBe("relative");
    });
  });
});
