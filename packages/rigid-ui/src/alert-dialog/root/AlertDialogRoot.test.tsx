import { createSignal } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { isJSDOM, render } from "../../../test/test-utils";
import { useDialogRootContext } from "../../dialog/root/DialogRootContext";
import { AlertDialog } from "../index";

// Ported from Base UI's `alert-dialog/root/AlertDialogRoot.test.tsx` (the jsdom-safe subset,
// with Chromium-only clusters behind `skipIf`).

function TestAlertDialog(
  props: {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, details: { reason: string; event: Event }) => void;
  } = {},
) {
  return (
    <AlertDialog.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
    >
      <AlertDialog.Trigger>Toggle</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Popup data-testid="popup">
          <AlertDialog.Title>Alert title</AlertDialog.Title>
          <AlertDialog.Description>Alert description</AlertDialog.Description>
          <AlertDialog.Close>Close</AlertDialog.Close>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

describe("AlertDialog", () => {
  it("renders alert dialog ARIA attributes", async () => {
    render(() => (
      <AlertDialog.Root open>
        <AlertDialog.Trigger />
        <AlertDialog.Portal>
          <AlertDialog.Popup>
            <AlertDialog.Title>title text</AlertDialog.Title>
            <AlertDialog.Description>description text</AlertDialog.Description>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ));

    const popup = await screen.findByRole("alertdialog");
    expect(popup).not.toBeNull();
    expect(screen.getByText("title text").getAttribute("id")).toBe(
      popup.getAttribute("aria-labelledby"),
    );
    expect(screen.getByText("description text").getAttribute("id")).toBe(
      popup.getAttribute("aria-describedby"),
    );
  });

  it("synchronizes trigger ARIA attributes in controlled mode", async () => {
    render(() => (
      <AlertDialog.Root open triggerId="trigger-2">
        <AlertDialog.Trigger id="trigger-1">Trigger 1</AlertDialog.Trigger>
        <AlertDialog.Trigger id="trigger-2">Trigger 2</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Popup>Dialog</AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ));

    const trigger1 = screen.getByText("Trigger 1");
    const trigger2 = screen.getByText("Trigger 2");
    const popup = await screen.findByRole("alertdialog");

    expect(trigger1).toHaveAttribute("aria-expanded", "false");
    expect(trigger1).not.toHaveAttribute("aria-controls");
    expect(trigger2).toHaveAttribute("aria-expanded", "true");
    expect(trigger2.getAttribute("aria-controls")).toBe(popup.getAttribute("id"));
  });

  it("synchronizes trigger ARIA attributes when initially open with a handle", async () => {
    const handle = AlertDialog.createHandle();

    render(() => (
      <AlertDialog.Root handle={handle} defaultOpen defaultTriggerId="trigger">
        <AlertDialog.Trigger id="trigger">Open</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Popup>Dialog</AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ));

    const trigger = screen.getByText("Open");
    const popup = await screen.findByRole("alertdialog");

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.getAttribute("aria-controls")).toBe(popup.getAttribute("id"));
  });

  it("synchronizes detached trigger ARIA attributes when initially open with a handle", async () => {
    const handle = AlertDialog.createHandle();

    render(() => (
      <>
        <AlertDialog.Trigger handle={handle} id="trigger">
          Open
        </AlertDialog.Trigger>
        <AlertDialog.Root handle={handle} defaultOpen defaultTriggerId="trigger">
          <AlertDialog.Portal>
            <AlertDialog.Popup>Dialog</AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </>
    ));

    const trigger = screen.getByText("Open");
    const popup = await screen.findByRole("alertdialog");

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.getAttribute("aria-controls")).toBe(popup.getAttribute("id"));
    expect(handle.isOpen).toBe(true);
  });

  it("renders a viewport", () => {
    render(() => (
      <AlertDialog.Root open>
        <AlertDialog.Portal>
          <AlertDialog.Viewport data-testid="viewport">
            <AlertDialog.Popup>Dialog</AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    ));

    expect(screen.getByTestId("viewport")).toContainElement(screen.getByRole("alertdialog"));
  });

  describe("prop: onOpenChange", () => {
    it("calls onOpenChange with the new open state", async () => {
      const handleOpenChange = vi.fn();
      render(() => <TestAlertDialog onOpenChange={handleOpenChange} />);

      expect(handleOpenChange.mock.calls.length).toBe(0);

      fireEvent.click(screen.getByText("Toggle"));
      await waitFor(() => expect(handleOpenChange.mock.calls.length).toBe(1));
      expect(handleOpenChange.mock.calls[0][0]).toBe(true);

      fireEvent.click(screen.getByText("Close"));
      await waitFor(() => expect(handleOpenChange.mock.calls.length).toBe(2));
      expect(handleOpenChange.mock.calls[1][0]).toBe(false);
    });

    it("calls onOpenChange with the reason for change when clicked on trigger and close button", async () => {
      const handleOpenChange = vi.fn();
      render(() => <TestAlertDialog onOpenChange={handleOpenChange} />);

      const openButton = screen.getByText("Toggle");
      fireEvent.click(openButton);
      await waitFor(() => expect(handleOpenChange.mock.calls.length).toBe(1));
      expect(handleOpenChange.mock.calls[0][1].reason).toBe("trigger-press");
      expect(handleOpenChange.mock.calls[0][1].trigger).toBe(openButton);
      expect((handleOpenChange.mock.calls[0][1].trigger as HTMLElement)?.id).toBe(openButton.id);

      fireEvent.click(screen.getByText("Close"));
      await waitFor(() => expect(handleOpenChange.mock.calls.length).toBe(2));
      expect(handleOpenChange.mock.calls[1][1].reason).toBe("close-press");
      // The trigger stays associated after close so focus can return to it.
      expect(handleOpenChange.mock.calls[1][1].trigger).toBe(openButton);
    });

    it("calls onOpenChange with the reason for change when pressed Esc while the dialog is open", async () => {
      const handleOpenChange = vi.fn();
      render(() => <TestAlertDialog defaultOpen onOpenChange={handleOpenChange} />);
      await screen.findByRole("alertdialog");

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => expect(handleOpenChange.mock.calls.length).toBe(1));
      expect(handleOpenChange.mock.calls[0][1].reason).toBe("escape-key");
    });

    it("does not close when the backdrop is clicked", async () => {
      const handleOpenChange = vi.fn();
      render(() => <TestAlertDialog defaultOpen onOpenChange={handleOpenChange} />);
      await screen.findByRole("alertdialog");

      fireEvent.click(screen.getByRole("presentation", { hidden: true }));

      expect(handleOpenChange.mock.calls.length).toBe(0);
      expect(screen.queryByRole("alertdialog")).not.toBeNull();
    });

    it("keeps the trigger data-popup-open attribute and handle.isOpen when a controlled close is vetoed", async () => {
      const handle = AlertDialog.createHandle();

      function TestCase() {
        const [open, setOpen] = createSignal(false);
        return (
          <AlertDialog.Root
            handle={handle}
            open={open()}
            onOpenChange={(nextOpen) => {
              if (nextOpen) {
                setOpen(true);
              }
            }}
          >
            <AlertDialog.Trigger>Open</AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                <AlertDialog.Title>Confirm</AlertDialog.Title>
                <AlertDialog.Close>Cancel</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        );
      }

      render(() => <TestCase />);

      const trigger = screen.getByRole("button", { name: "Open" });
      fireEvent.click(trigger);

      await screen.findByRole("alertdialog");
      expect(trigger).toHaveAttribute("data-popup-open");
      expect(handle.isOpen).toBe(true);

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.getByRole("alertdialog")).toHaveAttribute("data-open"));
      expect(trigger).toHaveAttribute("data-popup-open");
      expect(handle.isOpen).toBe(true);
    });
  });

  describe("prop: actionsRef", () => {
    it("unmounts the alert dialog when the `unmount` method is called", async () => {
      let actions: AlertDialog.Root.Actions | undefined;

      render(() => (
        <AlertDialog.Root
          actionsRef={(ref) => {
            actions = ref;
          }}
          onOpenChange={(open, details) => {
            if (!open) {
              details.preventUnmountOnClose();
            }
          }}
        >
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup />
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));

      const trigger = screen.getByText("Open");
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeNull());

      // The controlled close is vetoed through preventUnmountOnClose, so only an explicit
      // unmount removes the popup.
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeNull());

      actions?.unmount();
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    });

    it("clears manual unmount state after the `unmount` method is called", async () => {
      let actions: AlertDialog.Root.Actions | undefined;
      let shouldPreventUnmount = true;

      render(() => (
        <AlertDialog.Root
          actionsRef={(ref) => {
            actions = ref;
          }}
          onOpenChange={(open, details) => {
            if (!open && shouldPreventUnmount) {
              shouldPreventUnmount = false;
              details.preventUnmountOnClose();
            }
          }}
        >
          <AlertDialog.Trigger>Open</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));

      const trigger = screen.getByText("Open");
      fireEvent.click(trigger);
      await screen.findByRole("alertdialog");

      fireEvent.click(screen.getByText("Close"));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeNull());

      actions?.unmount();
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());

      // After a manual unmount, the dialog opens and closes normally again.
      fireEvent.click(trigger);
      await screen.findByRole("alertdialog");
      fireEvent.click(screen.getByText("Close"));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    });

    it("closes the alert dialog when the `close` method is called", async () => {
      let actions: AlertDialog.Root.Actions | undefined;
      render(() => (
        <AlertDialog.Root
          defaultOpen
          actionsRef={(ref) => {
            actions = ref;
          }}
        >
          <AlertDialog.Portal>
            <AlertDialog.Popup />
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));

      await screen.findByRole("alertdialog");

      actions?.close();

      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    });
  });

  describe.skipIf(isJSDOM)("multiple triggers within Root", () => {
    it("opens the alert dialog with any trigger", async () => {
      render(() => (
        <AlertDialog.Root>
          <AlertDialog.Trigger>Trigger 1</AlertDialog.Trigger>
          <AlertDialog.Trigger>Trigger 2</AlertDialog.Trigger>
          <AlertDialog.Trigger>Trigger 3</AlertDialog.Trigger>

          <AlertDialog.Portal>
            <AlertDialog.Popup>
              Alert dialog content
              <AlertDialog.Close>Close</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));

      const trigger1 = screen.getByRole("button", { name: "Trigger 1" });
      const trigger2 = screen.getByRole("button", { name: "Trigger 2" });
      const trigger3 = screen.getByRole("button", { name: "Trigger 3" });

      expect(screen.queryByText("Alert dialog content")).toBeNull();

      for (const trigger of [trigger1, trigger2, trigger3]) {
        fireEvent.click(trigger);
        await waitFor(() => expect(screen.queryByText("Alert dialog content")).not.toBeNull());
        fireEvent.click(screen.getByText("Close"));
        await waitFor(() => expect(screen.queryByText("Alert dialog content")).toBeNull());
      }
    });

    it("sets the payload and renders content based on its value", async () => {
      render(() => (
        <AlertDialog.Root<number>>
          {(state) => (
            <>
              <AlertDialog.Trigger payload={1}>Trigger 1</AlertDialog.Trigger>
              <AlertDialog.Trigger payload={2}>Trigger 2</AlertDialog.Trigger>

              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  <span data-testid="content">{state.payload}</span>
                  <AlertDialog.Close>Close</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </>
          )}
        </AlertDialog.Root>
      ));

      const trigger1 = screen.getByRole("button", { name: "Trigger 1" });
      const trigger2 = screen.getByRole("button", { name: "Trigger 2" });

      fireEvent.click(trigger1);
      await waitFor(() => expect(screen.getByTestId("content").textContent).toBe("1"));

      fireEvent.click(trigger2);
      await waitFor(() => expect(screen.getByTestId("content").textContent).toBe("2"));
    });

    it("reuses the popup DOM node when switching triggers", async () => {
      render(() => (
        <AlertDialog.Root<number>>
          {(state) => (
            <>
              <AlertDialog.Trigger payload={1}>Trigger 1</AlertDialog.Trigger>
              <AlertDialog.Trigger payload={2}>Trigger 2</AlertDialog.Trigger>

              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="alert-dialog-popup">
                  <span>{state.payload}</span>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            </>
          )}
        </AlertDialog.Root>
      ));

      const trigger1 = screen.getByRole("button", { name: "Trigger 1" });
      const trigger2 = screen.getByRole("button", { name: "Trigger 2" });

      fireEvent.click(trigger1);
      const popupElement = await screen.findByTestId("alert-dialog-popup");

      fireEvent.click(trigger2);
      expect(screen.getByTestId("alert-dialog-popup")).toBe(popupElement);
    });

    it("synchronizes ARIA attributes on the active trigger", async () => {
      render(() => (
        <AlertDialog.Root>
          <AlertDialog.Trigger>Trigger 1</AlertDialog.Trigger>
          <AlertDialog.Trigger>Trigger 2</AlertDialog.Trigger>

          <AlertDialog.Portal>
            <AlertDialog.Popup data-testid="alert-dialog-popup">
              Alert dialog content
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));

      const trigger1 = screen.getByRole("button", { name: "Trigger 1" });
      const trigger2 = screen.getByRole("button", { name: "Trigger 2" });

      expect(trigger1).toHaveAttribute("aria-expanded", "false");
      expect(trigger2).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(trigger1);

      const dialog = await screen.findByRole("alertdialog");
      const trigger1Controls = trigger1.getAttribute("aria-controls");
      expect(trigger1Controls).not.toBeNull();
      expect(dialog.getAttribute("id")).toBe(trigger1Controls);
      await waitFor(() => expect(trigger1).toHaveAttribute("aria-expanded", "true"));
      expect(trigger2).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe.skipIf(isJSDOM)("multiple detached triggers", () => {
    it("opens the alert dialog with any detached trigger", async () => {
      const testDialog = AlertDialog.createHandle();
      render(() => (
        <div>
          <AlertDialog.Trigger handle={testDialog}>Trigger 1</AlertDialog.Trigger>
          <AlertDialog.Trigger handle={testDialog}>Trigger 2</AlertDialog.Trigger>
          <AlertDialog.Trigger handle={testDialog}>Trigger 3</AlertDialog.Trigger>

          <AlertDialog.Root handle={testDialog}>
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                Alert dialog content
                <AlertDialog.Close>Close</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      ));

      const triggers = [
        screen.getByRole("button", { name: "Trigger 1" }),
        screen.getByRole("button", { name: "Trigger 2" }),
        screen.getByRole("button", { name: "Trigger 3" }),
      ];

      expect(screen.queryByText("Alert dialog content")).toBeNull();

      for (const trigger of triggers) {
        fireEvent.click(trigger);
        await waitFor(() => expect(screen.queryByText("Alert dialog content")).not.toBeNull());
        fireEvent.click(screen.getByText("Close"));
        await waitFor(() => expect(screen.queryByText("Alert dialog content")).toBeNull());
      }
    });

    it("sets the payload associated with the detached trigger", async () => {
      const testDialog = AlertDialog.createHandle<number>();
      render(() => (
        <div>
          <AlertDialog.Trigger handle={testDialog} payload={1}>
            Trigger 1
          </AlertDialog.Trigger>
          <AlertDialog.Trigger handle={testDialog} payload={2}>
            Trigger 2
          </AlertDialog.Trigger>

          <AlertDialog.Root handle={testDialog}>
            {(state) => (
              <AlertDialog.Portal>
                <AlertDialog.Popup>
                  <span data-testid="content">{state.payload}</span>
                  <AlertDialog.Close>Close</AlertDialog.Close>
                </AlertDialog.Popup>
              </AlertDialog.Portal>
            )}
          </AlertDialog.Root>
        </div>
      ));

      const trigger1 = screen.getByRole("button", { name: "Trigger 1" });
      const trigger2 = screen.getByRole("button", { name: "Trigger 2" });

      fireEvent.click(trigger1);
      await waitFor(() => expect(screen.getByTestId("content").textContent).toBe("1"));

      fireEvent.click(trigger2);
      await waitFor(() => expect(screen.getByTestId("content").textContent).toBe("2"));
    });
  });

  describe("imperative actions on the handle", () => {
    it("enforces alert dialog state for handle-backed roots", async () => {
      const handle = AlertDialog.createHandle();

      function AlertDialogState(props: Record<string, string>) {
        const store = useDialogRootContext();
        return (
          <div
            {...props}
            data-modal={String(store!.modal())}
            data-disable-pointer-dismissal={String(store!.disablePointerDismissal())}
            data-role={store!.role()}
          />
        );
      }

      render(() => (
        <>
          <AlertDialog.Trigger handle={handle}>Open</AlertDialog.Trigger>
          <AlertDialog.Root handle={handle}>
            <AlertDialogState data-testid="alert-dialog-state" />
            <AlertDialog.Portal>
              <AlertDialog.Popup>Content</AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </>
      ));

      expect(screen.getByTestId("alert-dialog-state")).toHaveAttribute("data-modal", "true");
      expect(screen.getByTestId("alert-dialog-state")).toHaveAttribute(
        "data-disable-pointer-dismissal",
        "true",
      );
      expect(screen.getByTestId("alert-dialog-state")).toHaveAttribute("data-role", "alertdialog");

      fireEvent.click(screen.getByRole("button", { name: "Open" }));

      await screen.findByRole("alertdialog");
      expect(handle.isOpen).toBe(true);

      fireEvent.click(screen.getByRole("presentation", { hidden: true }));
      await Promise.resolve();

      expect(screen.queryByRole("alertdialog")).not.toBeNull();
      expect(handle.isOpen).toBe(true);
    });

    it("keeps the alert dialog open when the backdrop is clicked", async () => {
      const handle = AlertDialog.createHandle();

      render(() => (
        <>
          <AlertDialog.Trigger handle={handle}>Open</AlertDialog.Trigger>
          <AlertDialog.Root handle={handle}>
            <AlertDialog.Portal>
              <AlertDialog.Popup>
                <AlertDialog.Close>Close</AlertDialog.Close>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </>
      ));

      fireEvent.click(screen.getByRole("button", { name: "Open" }));
      await screen.findByRole("alertdialog");

      const backdrop = screen.getByRole("presentation", { hidden: true });
      fireEvent.click(backdrop);
      await Promise.resolve();

      expect(screen.queryByRole("alertdialog")).not.toBeNull();
      expect(handle.isOpen).toBe(true);
    });

    it("opens and closes the dialog through the handle", async () => {
      const dialog = AlertDialog.createHandle();
      render(() => (
        <div>
          <AlertDialog.Trigger handle={dialog} id="trigger">
            Trigger
          </AlertDialog.Trigger>
          <AlertDialog.Root handle={dialog}>
            <AlertDialog.Portal>
              <AlertDialog.Popup data-testid="content">Content</AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      ));

      const trigger = screen.getByRole("button", { name: "Trigger" });
      expect(screen.queryByRole("alertdialog")).toBeNull();

      dialog.open("trigger");
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeNull());

      expect(screen.getByTestId("content").textContent).toBe("Content");
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      dialog.close();
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());

      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("opens imperatively with openWithPayload", async () => {
      const dialog = AlertDialog.createHandle<number>();
      render(() => (
        <div>
          <AlertDialog.Trigger handle={dialog} id="trigger1" payload={1}>
            Trigger 1
          </AlertDialog.Trigger>
          <AlertDialog.Trigger handle={dialog} id="trigger2" payload={2}>
            Trigger 2
          </AlertDialog.Trigger>
          <AlertDialog.Root handle={dialog}>
            {(state) => (
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="content">{state.payload}</AlertDialog.Popup>
              </AlertDialog.Portal>
            )}
          </AlertDialog.Root>
        </div>
      ));

      expect(screen.queryByRole("alertdialog")).toBeNull();

      dialog.openWithPayload(8);
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeNull());

      expect(screen.getByTestId("content").textContent).toBe("8");
      // Detached triggers sit outside a modal alert dialog's popup and are therefore
      // aria-hidden; query them by text rather than by role.
      const trigger1 = screen.getByText("Trigger 1");
      const trigger2 = screen.getByText("Trigger 2");
      expect(trigger1).toHaveAttribute("aria-expanded", "false");
      expect(trigger2).toHaveAttribute("aria-expanded", "false");

      dialog.close();
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    });
  });

  describe.skipIf(isJSDOM)("modality", () => {
    it("makes other interactive elements on the page inert when a modal dialog is open", async () => {
      render(() => (
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Trigger>Open Dialog</AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Popup>
              <AlertDialog.Close>Close Dialog</AlertDialog.Close>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      ));

      await screen.findByRole("alertdialog");
      expect(screen.getByRole("presentation", { hidden: true })).not.toBeNull();
    });
  });

  describe("prop: onOpenChangeComplete", () => {
    it("is called on close when there is no exit animation defined", async () => {
      const onOpenChangeComplete = vi.fn();

      function Test() {
        const [open, setOpen] = createSignal(true);
        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <AlertDialog.Root open={open()} onOpenChangeComplete={onOpenChangeComplete}>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="popup" />
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      render(() => <Test />);

      await screen.findByTestId("popup");
      // The enter completion is asynchronous even without animations.
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
      fireEvent.click(screen.getByText("Close"));

      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
      expect(onOpenChangeComplete.mock.lastCall?.[0]).toBe(false);
    });

    it("is called on open when there is no enter animation defined", async () => {
      const onOpenChangeComplete = vi.fn();

      function Test() {
        const [open, setOpen] = createSignal(false);
        return (
          <div>
            <button onClick={() => setOpen(true)}>Open</button>
            <AlertDialog.Root open={open()} onOpenChangeComplete={onOpenChangeComplete}>
              <AlertDialog.Portal>
                <AlertDialog.Popup data-testid="popup" />
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </div>
        );
      }

      render(() => <Test />);

      fireEvent.click(screen.getByText("Open"));

      await waitFor(() => expect(screen.queryByTestId("popup")).not.toBeNull());
      // The enter completion is asynchronous even without animations.
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
    });
  });
});
