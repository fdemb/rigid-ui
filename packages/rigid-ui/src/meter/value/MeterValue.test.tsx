import { createSignal } from "solid-js";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render, flushMicrotasks } from "../../../test/test-utils";
import { Meter } from "../index";

describe("<Meter.Value />", () => {
  it("forwards props, class, style, ref, events, and render props", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Meter.Root value={30}>
        <Meter.Value
          data-testid="part"
          id="custom"
          class={() => "custom"}
          style={() => ({ color: "red" })}
          ref={(element) => {
            ref = element;
          }}
          onClick={onClick}
          render={(props, state) => (
            <section {...props} data-state-keys={Object.keys(state).length} />
          )}
        />
      </Meter.Root>
    ));
    const element = screen.getByTestId("part");
    expect(element.tagName).toBe("SECTION");
    expect(element).toHaveAttribute("id", "custom");
    expect(element).toHaveClass("custom");
    expect(element.style.color).toBe("red");
    expect(element).toHaveAttribute("data-state-keys", "0");
    expect(ref).toBe(element);
    fireEvent.click(element);
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe("prop: children", () => {
    it("renders the value when children is not provided", async () => {
      render(() => (
        <Meter.Root value={30}>
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ));

      const value = screen.getByTestId("value");
      expect(value.textContent).toBe((0.3).toLocaleString(undefined, { style: "percent" }));
    });

    it("renders a formatted value when a format is provided", async () => {
      const format: Intl.NumberFormatOptions = {
        style: "currency",
        currency: "USD",
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }

      render(() => (
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value" />
        </Meter.Root>
      ));

      const value = screen.getByTestId("value");
      expect(value.textContent).toBe(formatValue(30));
    });

    it("accepts a render function", async () => {
      const renderSpy = vi.fn();
      const format: Intl.NumberFormatOptions = {
        style: "currency",
        currency: "USD",
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }
      render(() => (
        <Meter.Root value={30} format={format}>
          <Meter.Value data-testid="value">{renderSpy}</Meter.Value>
        </Meter.Root>
      ));
      expect(renderSpy.mock.lastCall?.[0]).toEqual(formatValue(30));
      expect(renderSpy.mock.lastCall?.[1]).toEqual(30);
    });

    it("passes updated arguments to the render function when value changes", async () => {
      const renderSpy = vi.fn();

      const [rootProps, setProps] = createSignal({ value: 30 });
      render(() => (
        <Meter.Root {...rootProps()}>
          <Meter.Value>{renderSpy}</Meter.Value>
        </Meter.Root>
      ));

      expect(renderSpy.mock.lastCall?.[0]).toEqual(
        (0.3).toLocaleString(undefined, { style: "percent" }),
      );
      expect(renderSpy.mock.lastCall?.[1]).toEqual(30);

      setProps({ value: 60 });
      await flushMicrotasks();

      expect(renderSpy.mock.lastCall?.[0]).toEqual(
        (0.6).toLocaleString(undefined, { style: "percent" }),
      );
      expect(renderSpy.mock.lastCall?.[1]).toEqual(60);
    });
  });
});
