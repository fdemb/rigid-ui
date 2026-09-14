import { screen } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { Errored } from "solid-js";
import { render } from "../../../test/test-utils";
import { Accordion } from "../index";

// Ported from Base UI's `header/AccordionHeader.test.tsx`. `describeConformance` is replaced
// with an explicit forwarding test.

describe("<Accordion.Header />", () => {
  it("throws when rendered outside an Accordion.Item", () => {
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
        <Accordion.Header />
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.",
    );
  });

  it("renders an h3 carrying the item state attributes", () => {
    let ref: HTMLElement | undefined;
    render(() => (
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Header
            data-testid="header"
            class="custom"
            ref={(element) => {
              ref = element;
            }}
          >
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>Panel</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));
    const element = screen.getByTestId("header");
    expect(element.tagName).toBe("H3");
    expect(element).toHaveClass("custom");
    expect(element).toHaveAttribute("data-open");
    expect(element).toHaveAttribute("data-index", "0");
    expect(ref).toBe(element);
  });
});
