import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render } from "../../../test/test-utils";
import { Progress } from "../index";
describe("<Progress.Value />", () => {
  it("forwards props, class, style, ref, events, and render props", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Progress.Root value={30}>
        <Progress.Value
          data-testid="part"
          id="custom"
          class={() => "custom"}
          style={() => ({ color: "red" })}
          ref={(element) => {
            ref = element;
          }}
          onClick={onClick}
          render={(props, state) => <section {...props} data-status={state.status} />}
        />
      </Progress.Root>
    ));
    const element = screen.getByTestId("part");
    expect(element.tagName).toBe("SECTION");
    expect(element).toHaveAttribute("id", "custom");
    expect(element).toHaveClass("custom");
    expect(element.style.color).toBe("red");
    expect(element).toHaveAttribute("data-status", "progressing");
    expect(ref).toBe(element);
    fireEvent.click(element);
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe("prop: children", () => {
    it("renders the value when children is not provided", async () => {
      render(() => (
        <Progress.Root value={30}>
          <Progress.Value data-testid="value" />
        </Progress.Root>
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
        <Progress.Root value={30} format={format}>
          <Progress.Value data-testid="value" />
        </Progress.Root>
      ));

      const value = screen.getByTestId("value");
      expect(value.textContent).toBe(formatValue(30));
    });

    describe("it accepts a render function", () => {
      it("numerical value", async () => {
        const renderSpy = vi.fn();
        const format: Intl.NumberFormatOptions = {
          style: "currency",
          currency: "USD",
        };
        function formatValue(v: number) {
          return new Intl.NumberFormat(undefined, format).format(v);
        }
        render(() => (
          <Progress.Root value={30} format={format}>
            <Progress.Value data-testid="value">{renderSpy}</Progress.Value>
          </Progress.Root>
        ));
        expect(renderSpy.mock.lastCall?.[0]).toEqual(formatValue(30));
        expect(renderSpy.mock.lastCall?.[1]).toEqual(30);
      });

      it.each([null, Number.NaN])("indeterminate value %s", async (value) => {
        const renderSpy = vi.fn();
        const format: Intl.NumberFormatOptions = {
          style: "currency",
          currency: "USD",
        };
        render(() => (
          <Progress.Root value={value} format={format}>
            <Progress.Value data-testid="value">{renderSpy}</Progress.Value>
          </Progress.Root>
        ));
        expect(renderSpy.mock.lastCall?.[0]).toEqual("indeterminate");
        expect(renderSpy.mock.lastCall?.[1]).toEqual(value);
      });
    });
  });
});
