import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { flushMicrotasks, render } from "../../../test/test-utils";
import { Accordion } from "../index";

// Ported from Base UI's `trigger/AccordionTrigger.test.tsx`. `describeConformance` is replaced
// with explicit forwarding tests.

describe("<Accordion.Trigger />", () => {
  it("forwards props, class, style, ref, and the render prop", () => {
    let ref: HTMLElement | undefined;
    render(() => (
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger
              data-testid="trigger"
              class="custom"
              style={{ color: "red" }}
              ref={(element) => {
                ref = element;
              }}
              render={(props, state) => (
                <button {...props} type="button" data-open-state={String(state.open)} />
              )}
            >
              Trigger
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));
    const element = screen.getByTestId("trigger");
    expect(element.tagName).toBe("BUTTON");
    expect(element).toHaveClass("custom");
    expect(element.style.color).toBe("red");
    expect(element).toHaveAttribute("data-open-state", "false");
    expect(element).toHaveAttribute("aria-expanded", "false");
    expect(ref).toBe(element);
  });

  it("keeps a non-native trigger tabbable", () => {
    render(() => (
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger nativeButton={false} render="span">
              Trigger
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    const trigger = screen.getByRole("button", { name: "Trigger" });
    expect(trigger).toHaveAttribute("tabindex", "0");
  });

  it("does not render the root value as data-value", () => {
    render(() => (
      <Accordion.Root value={["a", "b"]} multiple>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>header a</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel a</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Header>
            <Accordion.Trigger>header b</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel b</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    const triggers = screen.getAllByRole("button");
    expect(triggers[0]).not.toHaveAttribute("data-value");
    expect(triggers[1]).not.toHaveAttribute("data-value");
  });

  it("renders data-index on every trigger including the first", () => {
    render(() => (
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>first</Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger>second</Accordion.Trigger>
          </Accordion.Header>
        </Accordion.Item>
      </Accordion.Root>
    ));

    const triggers = screen.getAllByRole("button");
    expect(triggers[0]).toHaveAttribute("data-index", "0");
    expect(triggers[1]).toHaveAttribute("data-index", "1");
  });

  it("keeps data-panel-open instead of data-open", () => {
    render(() => (
      <Accordion.Root value={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>header a</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>panel a</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    const trigger = screen.getByRole("button", { name: "header a" });
    expect(trigger).toHaveAttribute("data-panel-open");
    expect(trigger).not.toHaveAttribute("data-open");
  });

  it("activates a non-native trigger with Enter and Space keyup", async () => {
    render(() => (
      <Accordion.Root>
        <Accordion.Item>
          <Accordion.Header>
            <Accordion.Trigger nativeButton={false} render="span">
              Trigger
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    const trigger = screen.getByRole("button", { name: "Trigger" });

    fireEvent.keyDown(trigger, { key: "Enter" });
    await flushMicrotasks();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyUp(trigger, { key: " " });
    await flushMicrotasks();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
