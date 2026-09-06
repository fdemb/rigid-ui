import { createSignal, Errored } from "solid-js";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render, flushMicrotasks } from "../../../test/test-utils";
import { Meter } from "../index";

describe("<Meter.Label />", () => {
  it("forwards props, class, style, ref, events, and render props", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Meter.Root value={30}>
        <Meter.Label
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

  it("updates and clears the meter label association", async () => {
    function App() {
      const [labelId, setLabelId] = createSignal("label-a");
      const [showLabel, setShowLabel] = createSignal(true);

      return (
        <>
          <Meter.Root value={50}>
            {showLabel() ? <Meter.Label id={labelId()}>Battery level</Meter.Label> : null}
          </Meter.Root>
          <button type="button" onClick={() => setLabelId("label-b")}>
            Change id
          </button>
          <button type="button" onClick={() => setShowLabel(false)}>
            Remove label
          </button>
        </>
      );
    }

    render(() => <App />);

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-labelledby", "label-a");

    fireEvent.click(screen.getByRole("button", { name: "Change id" }));
    await flushMicrotasks();
    expect(meter).toHaveAttribute("aria-labelledby", "label-b");

    fireEvent.click(screen.getByRole("button", { name: "Remove label" }));
    await flushMicrotasks();
    expect(meter).not.toHaveAttribute("aria-labelledby");
  });

  it("throws a descriptive error when rendered outside <Meter.Root>", () => {
    render(() => (
      <Errored fallback={(error) => <span>{String(error())}</span>}>
        <Meter.Label />
      </Errored>
    ));
    expect(screen.getByText(/MeterRootContext is missing/)).toHaveTextContent(
      "Meter parts must be placed within <Meter.Root>.",
    );
  });
});
