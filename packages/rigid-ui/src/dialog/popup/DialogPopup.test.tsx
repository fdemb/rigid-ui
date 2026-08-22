import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { render, isJSDOM } from "../../../test/test-utils";
import { Dialog } from "../index";

// Ported from Base UI's `popup/DialogPopup.test.tsx` (jsdom-safe subset). The Chromium-only
// `display: contents` and nested-dialog-count describes are ported in the Chromium suite.

describe("Dialog.Popup", () => {
  describe.skipIf(!isJSDOM)("focus management", () => {
    it("focuses the popup itself when opened by touch", async () => {
      render(() => (
        <Dialog.Root modal={false}>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>
              <button>Inside</button>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      const trigger = screen.getByRole("button", { name: "Toggle" });
      // Simulate the trigger pairing that records a touch open method.
      fireEvent.pointerDown(trigger, { pointerType: "touch" });
      fireEvent.click(trigger, { detail: 1 });
      const popup = await screen.findByRole("dialog");
      await waitFor(() => expect(popup).toHaveFocus());
    });

    it("restores focus to the popup when its focused element is removed", async () => {
      function Removable() {
        return (
          <Dialog.Root defaultOpen modal={false}>
            <Dialog.Portal>
              <Dialog.Popup data-testid="popup">
                <button id="hide-me">Hide me</button>
                <button>Other</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }
      render(() => <Removable />);
      await screen.findByRole("dialog");
      const hidden = document.getElementById("hide-me")!;
      hidden.focus();
      expect(hidden).toHaveFocus();

      // Browsers fire `focusout` when a focused element is hidden or removed; jsdom needs the
      // explicit blur to take the same path.
      hidden.blur();
      hidden.remove();
      const popup = screen.getByTestId("popup");
      await waitFor(() => expect(popup).toHaveFocus());
    });

    it("does not move focus on close when finalFocus=false", async () => {
      render(() => (
        <Dialog.Root defaultOpen>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal keepMounted>
            <Dialog.Popup data-testid="popup" finalFocus={false}>
              <button>Inside</button>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      await screen.findByRole("dialog");
      const popup = screen.getByTestId("popup");
      const inside = screen.getByRole("button", { name: "Inside" });
      inside.focus();
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(popup).toHaveAttribute("data-closed"));
      expect(inside).toHaveFocus();
    });

    it("returns focus to an element chosen by a finalFocus function", async () => {
      render(() => (
        <Dialog.Root defaultOpen>
          <Dialog.Trigger>Toggle</Dialog.Trigger>
          <Dialog.Portal keepMounted>
            <Dialog.Popup
              finalFocus={(closeType) =>
                closeType === "keyboard"
                  ? document.querySelector<HTMLButtonElement>("[data-testid=return-target]")
                  : false
              }
            >
              <button>Inside</button>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));
      await screen.findByRole("dialog");
      const target = document.createElement("button");
      target.setAttribute("data-testid", "return-target");
      document.body.append(target);
      try {
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        await waitFor(() => expect(target).toHaveFocus());
      } finally {
        target.remove();
      }
    });
  });

  it("wraps focus to the last element when the before guard receives focus", async () => {
    render(() => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">
            <button data-testid="first">First</button>
            <button data-testid="last">Last</button>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ));
    await screen.findByRole("dialog");
    const first = screen.getByTestId("first");
    await waitFor(() => expect(first).toHaveFocus());

    const [, afterGuard] = document.querySelectorAll<HTMLElement>("[data-rigid-ui-focus-guard]");
    expect(afterGuard).toBeDefined();
    fireEvent.focus(afterGuard);
    await waitFor(() => expect(first).toHaveFocus());
  });

  it("wraps focus to the first element when the after guard receives focus", async () => {
    render(() => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">
            <button data-testid="first">First</button>
            <button data-testid="last">Last</button>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ));
    await screen.findByRole("dialog");
    const last = screen.getByTestId("last");
    await waitFor(() =>
      expect([screen.getByTestId("first"), last]).toContain(document.activeElement),
    );

    const [beforeGuard] = document.querySelectorAll<HTMLElement>("[data-rigid-ui-focus-guard]");
    fireEvent.focus(beforeGuard);
    await waitFor(() => expect(last).toHaveFocus());
  });

  it("keeps the popup programmatically focusable with no tabbable content", async () => {
    render(() => (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup data-testid="popup">Only text</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    ));
    const popup = await screen.findByTestId("popup");
    await waitFor(() => expect(popup).toHaveFocus());
  });
});
