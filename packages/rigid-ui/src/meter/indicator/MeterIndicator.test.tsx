import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render, isJSDOM } from "../../../test/test-utils";
import { Meter } from "../index";

describe("<Meter.Indicator />", () => {
  it("forwards props, class, style, ref, events, and render props", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Meter.Root value={30}>
        <Meter.Indicator
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

  describe("value bounds", () => {
    it("clamps the width to 100% when the value exceeds max", async () => {
      render(() => (
        <Meter.Root value={150}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ));

      expect(screen.getByTestId("indicator").style.width).toBe("100%");
    });

    it("clamps the width to 0% when the value is below min", async () => {
      render(() => (
        <Meter.Root value={-10}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ));

      expect(screen.getByTestId("indicator").style.width).toBe("0%");
    });

    it("produces a finite width when min equals max", async () => {
      render(() => (
        <Meter.Root value={5} min={5} max={5}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ));

      expect(screen.getByTestId("indicator").style.width).toBe("0%");
    });
  });

  describe.skipIf(isJSDOM)("internal styles", () => {
    it("sets positioning styles", async () => {
      render(() => (
        <Meter.Root value={33} style={{ width: "100px" }}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ));

      const indicator = screen.getByTestId("indicator");

      expect(getComputedStyle(indicator).left).toBe("0px");
      expect(getComputedStyle(indicator).width).toBe("33px");
    });

    it("sets zero width when value is 0", async () => {
      render(() => (
        <Meter.Root value={0} style={{ width: "100px" }}>
          <Meter.Track>
            <Meter.Indicator data-testid="indicator" />
          </Meter.Track>
        </Meter.Root>
      ));

      const indicator = screen.getByTestId("indicator");

      expect(getComputedStyle(indicator).insetInlineStart).toBe("0px");
      expect(getComputedStyle(indicator).width).toBe("0px");
    });
  });
});
