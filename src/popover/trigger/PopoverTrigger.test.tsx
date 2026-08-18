import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { Errored } from "solid-js";
import { flushMicrotasks, render } from "../../../test/test-utils";
import { Popover } from "../index";

// Ported from Base UI's `trigger/PopoverTrigger.test.tsx`. The patient/impatient click
// (`stickIfOpen`) cases are omitted: that behaviour is not implemented, tracked in BACKLOG.md.

function MultiTriggerPopover() {
  return (
    <Popover.Root<string>>
      {(state) => (
        <>
          <Popover.Trigger payload="One" id="one" openOnHover delay={0}>
            One
          </Popover.Trigger>
          <Popover.Trigger payload="Two" id="two" openOnHover delay={0}>
            Two
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

/** A physical press of either pointer type reports `detail: 1`; only keyboards report 0. */
function pressTrigger(trigger: HTMLElement, pointerType: "mouse" | "touch") {
  fireEvent.pointerDown(trigger, { pointerType });
  fireEvent.click(trigger, { detail: 1 });
}

/** Lets a `delay={0}` hover timer run; it is a macrotask, so flushing microtasks is not enough. */
function settleHoverDelay() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

describe("<Popover.Trigger />", () => {
  it("throws a descriptive error when rendered without a root or a handle", () => {
    let caught: unknown;
    // An uncaught throw halts Solid's reactive system for the rest of the module, so the error
    // has to be captured by a boundary.
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <Popover.Trigger>Toggle</Popover.Trigger>
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: <Popover.Trigger> must be used within <Popover.Root> or receive a handle.",
    );
  });

  describe("prop: disabled", () => {
    it("does not open the popover", async () => {
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

      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(screen.queryByText("Content")).toBeNull();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("does not open on hover", async () => {
      render(() => (
        <Popover.Root>
          <Popover.Trigger disabled openOnHover delay={0}>
            Toggle
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      fireEvent.pointerEnter(screen.getByRole("button", { name: "Toggle" }), {
        pointerType: "mouse",
      });
      await flushMicrotasks();

      expect(screen.queryByText("Content")).toBeNull();
    });
  });

  describe("style hooks", () => {
    it("sets data-popup-open and data-pressed when opened by clicking", async () => {
      render(() => (
        <Popover.Root>
          <Popover.Trigger>Toggle</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);

      await waitFor(() => expect(trigger).toHaveAttribute("data-popup-open"));
      expect(trigger).toHaveAttribute("data-pressed");
    });

    it("sets data-popup-open but not data-pressed when opened by hover", async () => {
      render(() => (
        <Popover.Root>
          <Popover.Trigger openOnHover delay={0}>
            Toggle
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.pointerEnter(trigger, { pointerType: "mouse" });

      await waitFor(() => expect(trigger).toHaveAttribute("data-popup-open"));
      expect(trigger).not.toHaveAttribute("data-pressed");
    });

    it("sets neither attribute while closed", () => {
      render(() => (
        <Popover.Root>
          <Popover.Trigger>Toggle</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const trigger = screen.getByRole("button", { name: "Toggle" });
      expect(trigger).not.toHaveAttribute("data-popup-open");
      expect(trigger).not.toHaveAttribute("data-pressed");
    });

    it("only marks the active trigger as open", async () => {
      render(() => <MultiTriggerPopover />);

      const one = screen.getByRole("button", { name: "One" });
      const two = screen.getByRole("button", { name: "Two" });

      fireEvent.click(one);
      await waitFor(() => expect(one).toHaveAttribute("data-popup-open"));
      expect(two).not.toHaveAttribute("data-popup-open");
    });
  });

  describe("touch ownership", () => {
    it("keeps ownership on the tapped trigger when a sibling is hovered", async () => {
      render(() => <MultiTriggerPopover />);

      const one = screen.getByRole("button", { name: "One" });
      const two = screen.getByRole("button", { name: "Two" });

      pressTrigger(one, "touch");
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("One"));

      // A touch tap parks the pointer wherever the cursor happens to be, so a stray *mouse*
      // hover over a sibling must not silently swap the content the user just tapped for.
      fireEvent.pointerEnter(two, { pointerType: "mouse" });
      // The hover open is scheduled on a timer, so microtask flushing alone would let this
      // assertion pass without the guard ever being exercised.
      await settleHoverDelay();

      expect(screen.getByTestId("content")).toHaveTextContent("One");
      expect(two).toHaveAttribute("aria-expanded", "false");
    });

    it("hands ownership to a hovered sibling when opened by mouse", async () => {
      render(() => <MultiTriggerPopover />);

      const one = screen.getByRole("button", { name: "One" });
      const two = screen.getByRole("button", { name: "Two" });

      pressTrigger(one, "mouse");
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("One"));

      // The same hover must still take over for a mouse, so the guard above cannot be a
      // blanket disable.
      fireEvent.pointerEnter(two, { pointerType: "mouse" });
      await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("Two"));
      expect(two).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("prop: delay", () => {
    it("opens after the hover delay elapses", async () => {
      vi.useFakeTimers();
      try {
        render(() => (
          <Popover.Root>
            <Popover.Trigger openOnHover delay={100}>
              Toggle
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ));

        fireEvent.pointerEnter(screen.getByRole("button", { name: "Toggle" }), {
          pointerType: "mouse",
        });

        vi.advanceTimersByTime(99);
        await flushMicrotasks();
        expect(screen.queryByText("Content")).toBeNull();

        vi.advanceTimersByTime(1);
        await flushMicrotasks();
        expect(screen.getByText("Content")).not.toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
