import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { Errored } from "solid-js";
import { flushMicrotasks, render } from "../../../test/test-utils";
import { Accordion } from "../index";

// Ported from Base UI's `item/AccordionItem.test.tsx`. `describeConformance` is replaced with
// an explicit forwarding test.

describe("<Accordion.Item />", () => {
  it("throws when rendered outside an Accordion.Root", () => {
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
        <Accordion.Item />
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Base UI: AccordionRootContext is missing. Accordion parts must be placed within <Accordion.Root>.",
    );
  });

  it("forwards props, class, style, ref, and the render prop", () => {
    let ref: HTMLElement | undefined;
    render(() => (
      <Accordion.Root>
        <Accordion.Item
          data-testid="item"
          id="custom"
          class="custom"
          style={{ color: "red" }}
          ref={(element) => {
            ref = element;
          }}
          render={(props, state) => <section {...props} data-open-state={String(state.open)} />}
        />
      </Accordion.Root>
    ));
    const element = screen.getByTestId("item");
    expect(element.tagName).toBe("SECTION");
    expect(element).toHaveAttribute("id", "custom");
    expect(element).toHaveClass("custom");
    expect(element.style.color).toBe("red");
    expect(element).toHaveAttribute("data-open-state", "false");
    expect(element).toHaveAttribute("data-index", "0");
    expect(ref).toBe(element);
  });

  it("does not report hidden=true after the item has started opening", async () => {
    const seen: Array<{ open: boolean; hidden: boolean }> = [];
    render(() => (
      <Accordion.Root>
        <Accordion.Item
          render={(props, state) => {
            seen.push({ open: state.open, hidden: state.hidden });
            return <div {...props} />;
          }}
        >
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    await flushMicrotasks();

    expect(seen.some((state) => state.open && state.hidden)).toBe(false);
    expect(seen.some((state) => state.open && !state.hidden)).toBe(true);
  });

  it("fires onOpenChange with the next open state", async () => {
    const onOpenChange = vi.fn();
    render(() => (
      <Accordion.Root>
        <Accordion.Item value="a" onOpenChange={onOpenChange}>
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    await flushMicrotasks();

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
  });
});
