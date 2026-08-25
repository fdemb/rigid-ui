import { createSignal } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { render } from "../../../test/test-utils";
import { Dialog } from "../index";

describe("<Dialog.Viewport />", () => {
  it("forwards its ref, native props, class, and style", () => {
    let viewportRef: HTMLDivElement | undefined;

    render(() => (
      <Dialog.Root defaultOpen modal={false}>
        <Dialog.Portal>
          <Dialog.Viewport
            ref={(element) => (viewportRef = element)}
            data-testid="viewport"
            data-custom="forwarded"
            class="viewport-class"
            style={{ overflow: "auto" }}
          >
            <Dialog.Popup>Content</Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    ));

    const viewport = screen.getByTestId("viewport");
    expect(viewportRef).toBe(viewport);
    expect(viewport).toHaveAttribute("role", "presentation");
    expect(viewport).toHaveAttribute("data-custom", "forwarded");
    expect(viewport).toHaveClass("viewport-class");
    expect(viewport).toHaveStyle({ overflow: "auto" });
  });

  it("renders only when the dialog is mounted by default", async () => {
    function App() {
      const [open, setOpen] = createSignal(false);
      return (
        <Dialog.Root open={open()} onOpenChange={setOpen} modal={false}>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Viewport data-testid="viewport">
              <Dialog.Popup data-testid="popup">Content</Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }

    render(() => <App />);

    expect(screen.queryByTestId("viewport")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    await waitFor(() => expect(screen.getByTestId("viewport")).toBeInTheDocument());
    expect(screen.getByTestId("viewport")).toContainElement(screen.getByTestId("popup"));
  });

  it("stays mounted when used within a keepMounted portal", async () => {
    const [open, setOpen] = createSignal(true);

    render(() => (
      <Dialog.Root open={open()} modal={false}>
        <Dialog.Portal keepMounted>
          <Dialog.Viewport data-testid="viewport">
            <Dialog.Popup>Content</Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    ));

    expect(screen.getByTestId("viewport")).toBeInTheDocument();

    setOpen(false);

    await waitFor(() => {
      const viewport = screen.getByTestId("viewport");
      expect(viewport).toHaveAttribute("data-closed");
      expect(viewport).toHaveAttribute("hidden");
      expect(viewport).toHaveStyle({ pointerEvents: "none" });
    });
  });
});
