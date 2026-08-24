import { Errored } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { render } from "../../../test/test-utils";
import { Popover } from "../index";
import type { PopoverFocusTarget } from "../types";

// Ported from Base UI's `popup/PopoverPopup.test.tsx`. Toolbar composite-key cases are omitted:
// this library has no Toolbar. Focus-guard cases are tracked in Linear.

function FocusPopover(props: {
  initialFocus?: PopoverFocusTarget;
  finalFocus?: PopoverFocusTarget;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup
            data-testid="popup"
            initialFocus={props.initialFocus}
            finalFocus={props.finalFocus}
          >
            <input data-testid="input-1" />
            <input data-testid="input-2" />
            <Popover.Close>Close</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function openPopover() {
  fireEvent.click(screen.getByRole("button", { name: "Open" }), { detail: 1 });
}

describe("<Popover.Popup />", () => {
  it("throws a descriptive error when rendered outside <Popover.Positioner>", () => {
    let caught: unknown;
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <Popover.Root defaultOpen>
          <Popover.Portal>
            <Popover.Popup>Content</Popover.Popup>
          </Popover.Portal>
        </Popover.Root>
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: this Popover part must be used within <Popover.Positioner>.",
    );
  });

  describe("prop: initialFocus", () => {
    it("focuses the first focusable element by default", async () => {
      render(() => <FocusPopover />);
      openPopover();

      await waitFor(() => expect(screen.getByTestId("input-1")).toHaveFocus());
    });

    it("focuses the element given as a ref object", async () => {
      let input2: HTMLInputElement | undefined;
      render(() => (
        <Popover.Root>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup
                initialFocus={{
                  get current() {
                    return input2 ?? null;
                  },
                }}
              >
                <input data-testid="input-1" />
                <input data-testid="input-2" ref={(element) => (input2 = element)} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      openPopover();

      await waitFor(() => expect(screen.getByTestId("input-2")).toHaveFocus());
    });

    it("focuses the element returned by a function", async () => {
      let input2: HTMLInputElement | undefined;
      render(() => (
        <Popover.Root>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup initialFocus={() => input2 ?? null}>
                <input data-testid="input-1" />
                <input data-testid="input-2" ref={(element) => (input2 = element)} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));
      openPopover();

      await waitFor(() => expect(screen.getByTestId("input-2")).toHaveFocus());
    });

    it("does not move focus when given false", async () => {
      render(() => <FocusPopover initialFocus={false} />);
      const trigger = screen.getByRole("button", { name: "Open" });
      trigger.focus();
      openPopover();

      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());
      expect(trigger).toHaveFocus();
    });

    it("uses the default behavior when the function returns null", async () => {
      render(() => <FocusPopover initialFocus={() => null} />);
      openPopover();

      await waitFor(() => expect(screen.getByTestId("input-1")).toHaveFocus());
    });

    it("receives the interaction type that opened the popover", async () => {
      const seen: string[] = [];
      render(() => (
        <FocusPopover
          initialFocus={(interactionType) => {
            seen.push(interactionType);
            return false;
          }}
        />
      ));

      const trigger = screen.getByRole("button", { name: "Open" });
      // Keyboard activation reports a click with `detail === 0`.
      fireEvent.click(trigger, { detail: 0 });
      await waitFor(() => expect(seen).toEqual(["keyboard"]));

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());

      fireEvent.pointerDown(trigger, { pointerType: "mouse" });
      fireEvent.click(trigger, { detail: 1 });
      await waitFor(() => expect(seen).toEqual(["keyboard", "mouse"]));
    });
  });

  describe("prop: finalFocus", () => {
    it("focuses the trigger by default when closed", async () => {
      render(() => <FocusPopover />);
      openPopover();
      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Open" })).toHaveFocus());
    });

    it("focuses the element given as a ref object", async () => {
      let final: HTMLInputElement | undefined;
      render(() => (
        <>
          <FocusPopover
            finalFocus={{
              get current() {
                return final ?? null;
              },
            }}
          />
          <input data-testid="final" ref={(element) => (final = element)} />
        </>
      ));

      openPopover();
      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.getByTestId("final")).toHaveFocus());
    });

    it("does not move focus when given false", async () => {
      render(() => <FocusPopover finalFocus={false} />);
      openPopover();
      await waitFor(() => expect(screen.getByTestId("input-1")).toHaveFocus());

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
      expect(screen.getByRole("button", { name: "Open" })).not.toHaveFocus();
    });

    it("uses the default behavior when the function returns null", async () => {
      render(() => <FocusPopover finalFocus={() => null} />);
      openPopover();
      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());

      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Open" })).toHaveFocus());
    });

    it("selects a target based on the interaction type that closed the popover", async () => {
      let final: HTMLInputElement | undefined;
      render(() => (
        <>
          <FocusPopover
            finalFocus={(interactionType) =>
              interactionType === "keyboard" ? (final ?? null) : true
            }
          />
          <input data-testid="final" ref={(element) => (final = element)} />
        </>
      ));

      // Open by pointer, then close by pointer. `true` means the default, so focus returns to the
      // trigger.
      fireEvent.pointerDown(screen.getByRole("button", { name: "Open" }), { pointerType: "mouse" });
      fireEvent.click(screen.getByRole("button", { name: "Open" }), { detail: 1 });
      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());
      fireEvent.pointerDown(screen.getByRole("button", { name: "Close" }), {
        pointerType: "mouse",
      });
      fireEvent.click(screen.getByRole("button", { name: "Close" }), { detail: 1 });
      await waitFor(() => expect(screen.getByRole("button", { name: "Open" })).toHaveFocus());

      // Open by pointer, then close by keyboard. The callback now sees the close type.
      fireEvent.pointerDown(screen.getByRole("button", { name: "Open" }), { pointerType: "mouse" });
      fireEvent.click(screen.getByRole("button", { name: "Open" }), { detail: 1 });
      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());
      fireEvent.click(screen.getByRole("button", { name: "Close" }), { detail: 0 });
      await waitFor(() => expect(screen.getByTestId("final")).toHaveFocus());
    });
  });
});
