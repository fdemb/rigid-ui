import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { isJSDOM, render } from "../../../test/test-utils";
import { Popover } from "../index";
import type { PopoverRootActions, PopoverRootChangeEventDetails } from "../types";

// Ported from Base UI's `root/PopoverRoot.test.tsx`. Cases covering parts this library does not
// implement (internal backdrop, focus guards, safe polygon, nested menus) are tracked in
// Linear rather than skipped here.

function TestPopover(props: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, details: PopoverRootChangeEventDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  actionsRef?: { current: PopoverRootActions | null };
  popupClass?: string;
}) {
  return (
    <Popover.Root
      open={props.open}
      defaultOpen={props.defaultOpen}
      onOpenChange={props.onOpenChange}
      onOpenChangeComplete={props.onOpenChangeComplete}
      actionsRef={props.actionsRef}
    >
      <Popover.Trigger>Toggle</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner data-testid="positioner">
          <Popover.Popup data-testid="popup" class={props.popupClass}>
            Content
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

describe("<Popover.Root />", () => {
  describe("prop: actionsRef", () => {
    it("unmounts the popover when the `unmount` method is called", async () => {
      const actionsRef: { current: PopoverRootActions | null } = { current: null };
      render(() => (
        <TestPopover
          actionsRef={actionsRef}
          onOpenChange={(_open, details) => details.preventUnmountOnClose()}
        />
      ));

      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByTestId("popup")).not.toBeNull());

      // The close is prevented from unmounting, so the popup stays in the DOM.
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.getByTestId("positioner")).toHaveAttribute("data-closed"));
      expect(screen.queryByTestId("popup")).not.toBeNull();

      actionsRef.current!.unmount();
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
    });

    it("closes the popover when the `close` method is called", async () => {
      const actionsRef: { current: PopoverRootActions | null } = { current: null };
      render(() => <TestPopover defaultOpen actionsRef={actionsRef} />);

      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());

      actionsRef.current!.close();
      await waitFor(() => expect(screen.queryByText("Content")).toBeNull());
    });

    it("clears the ref on unmount", () => {
      const actionsRef: { current: PopoverRootActions | null } = { current: null };
      const view = render(() => <TestPopover actionsRef={actionsRef} />);

      expect(actionsRef.current).not.toBeNull();
      view.unmount();
      expect(actionsRef.current).toBeNull();
    });
  });

  describe("preventUnmountOnClose()", () => {
    it("keeps the popup mounted after a prevented close", async () => {
      render(() => (
        <TestPopover
          defaultOpen
          onOpenChange={(_open, details) => details.preventUnmountOnClose()}
        />
      ));

      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.getByTestId("positioner")).toHaveAttribute("data-closed"));
      expect(screen.queryByTestId("popup")).not.toBeNull();
    });

    it("unmounts on a normal close after a prevented close and reopen", async () => {
      // A plain variable, not a signal: writes to a signal from outside a reactive context are
      // not visible to reads until the next flush, which would make the toggle below a no-op.
      let prevent = true;
      render(() => (
        <TestPopover
          defaultOpen
          onOpenChange={(_open, details) => {
            if (prevent) details.preventUnmountOnClose();
          }}
        />
      ));

      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.getByTestId("positioner")).toHaveAttribute("data-closed"));
      expect(screen.queryByTestId("popup")).not.toBeNull();

      // Reopen, then close without preventing: the popup must unmount this time. The flag must
      // not leak from the earlier prevented close.
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.getByTestId("positioner")).toHaveAttribute("data-open"));

      prevent = false;
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
    });

    it("does not leak from a canceled close into a synchronous second close", async () => {
      let closeCount = 0;
      render(() => (
        <TestPopover
          defaultOpen
          onOpenChange={(open, details) => {
            if (open) return;
            closeCount += 1;
            // Only the first close asks to stay mounted; the second must unmount.
            if (closeCount === 1) {
              details.preventUnmountOnClose();
              details.cancel();
            }
          }}
        />
      ));

      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await waitFor(() => expect(closeCount).toBe(1));
      expect(screen.getByTestId("positioner")).toHaveAttribute("data-open");

      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
    });
  });

  describe("prop: onOpenChangeComplete", () => {
    it("does not get called on mount when not open", async () => {
      const onOpenChangeComplete = vi.fn();
      render(() => <TestPopover onOpenChangeComplete={onOpenChangeComplete} />);

      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
      expect(onOpenChangeComplete).not.toHaveBeenCalled();
    });

    it("is called on open when there is no enter animation defined", async () => {
      const onOpenChangeComplete = vi.fn();
      render(() => <TestPopover onOpenChangeComplete={onOpenChangeComplete} />);

      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
    });

    it("is called on close when there is no exit animation defined", async () => {
      const onOpenChangeComplete = vi.fn();
      render(() => <TestPopover defaultOpen onOpenChangeComplete={onOpenChangeComplete} />);

      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));

      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
      expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false);
    });

    it.skipIf(isJSDOM)("waits for the enter animation to finish", async () => {
      const onOpenChangeComplete = vi.fn();
      render(() => (
        <>
          <style>
            {`
              @keyframes enter-test { from { opacity: 0; } }
              .enter-animated[data-starting-style] { animation: enter-test 60ms; }
            `}
          </style>
          <TestPopover popupClass="enter-animated" onOpenChangeComplete={onOpenChangeComplete} />
        </>
      ));

      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      await waitFor(() => expect(screen.getByTestId("popup")).toBeVisible());
      expect(onOpenChangeComplete).not.toHaveBeenCalled();

      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
    });

    it.skipIf(isJSDOM)("waits for the exit animation to finish before unmounting", async () => {
      const onOpenChangeComplete = vi.fn();
      render(() => (
        <>
          <style>
            {`
              @keyframes exit-test { to { opacity: 0; } }
              .exit-animated[data-ending-style] { animation: exit-test 60ms; }
            `}
          </style>
          <TestPopover
            defaultOpen
            popupClass="exit-animated"
            onOpenChangeComplete={onOpenChangeComplete}
          />
        </>
      ));

      await waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));

      fireEvent.click(screen.getByRole("button", { name: "Toggle" }));
      // Still mounted while the exit animation plays.
      await waitFor(() => expect(screen.getByTestId("popup")).toHaveAttribute("data-ending-style"));
      expect(onOpenChangeComplete).not.toHaveBeenLastCalledWith(false);

      await waitFor(() => expect(screen.queryByTestId("popup")).toBeNull());
      expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false);
    });
  });
});
