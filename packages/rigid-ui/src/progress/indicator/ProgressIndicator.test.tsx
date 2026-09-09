import { createSignal } from "solid-js";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render, isJSDOM, flushMicrotasks } from "../../../test/test-utils";
import { Progress } from "../index";

describe("<Progress.Indicator />", () => {
  it("forwards props, class, style, ref, events, and render props", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Progress.Root value={30}>
        <Progress.Indicator
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
});

describe.skipIf(isJSDOM)("internal styles", () => {
  it("determinate", () => {
    render(() => (
      <Progress.Root value={33}>
        <Progress.Track>
          <Progress.Indicator data-testid="indicator" render="span" />
        </Progress.Track>
      </Progress.Root>
    ));
    const style = getComputedStyle(screen.getByTestId("indicator"));
    expect(style.insetInlineStart).toBe("0px");
    expect(style.width).toBe("33%");
  });

  it("sets zero width when value is 0", () => {
    render(() => (
      <Progress.Root value={0}>
        <Progress.Track>
          <Progress.Indicator data-testid="indicator" />
        </Progress.Track>
      </Progress.Root>
    ));
    const style = getComputedStyle(screen.getByTestId("indicator"));
    expect(style.insetInlineStart).toBe("0px");
    expect(style.width).toBe("0px");
  });

  it.each(["ltr", "rtl"] as const)(
    "updates real geometry and clears determinate styles in %s",
    async (dir) => {
      const [value, setValue] = createSignal<number | null>(30);
      render(() => (
        <Progress.Root value={value()} min={20} max={40} dir={dir}>
          <Progress.Track data-testid="track" style={{ width: "200px", height: "8px" }}>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ));
      const indicator = screen.getByTestId("indicator");
      const track = screen.getByTestId("track");
      expect(indicator.getBoundingClientRect().width).toBe(100);
      expect(indicator.getBoundingClientRect().height).toBe(8);
      expect(indicator.getBoundingClientRect()[dir === "rtl" ? "right" : "left"]).toBe(
        track.getBoundingClientRect()[dir === "rtl" ? "right" : "left"],
      );
      setValue(50);
      await flushMicrotasks();
      expect(indicator.getBoundingClientRect().width).toBe(200);
      setValue(null);
      await flushMicrotasks();
      expect(indicator).toHaveAttribute("data-indeterminate");
      expect(indicator.style.width).toBe("");
      expect(indicator.style.height).toBe("");
      expect(indicator.style.insetInlineStart).toBe("");
      expect(getComputedStyle(indicator).insetInlineStart).toBe("auto");
    },
  );

  it("leaves indeterminate sizing to the consumer", () => {
    render(() => (
      <Progress.Root value={null}>
        <Progress.Track>
          <Progress.Indicator data-testid="indicator" style={{ width: "40px", height: "6px" }} />
        </Progress.Track>
      </Progress.Root>
    ));
    const indicator = screen.getByTestId("indicator");
    expect(indicator.getBoundingClientRect().width).toBe(40);
    expect(indicator.getBoundingClientRect().height).toBe(6);
    expect(getComputedStyle(indicator).insetInlineStart).toBe("auto");
  });
});
