import { createSignal, Errored } from "solid-js";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render, flushMicrotasks } from "../../../test/test-utils";
import { Progress } from "../index";

describe("<Progress.Label />", () => {
  it("forwards props, class, style, ref, events, and render props", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Progress.Root value={30}>
        <Progress.Label
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

  it("updates and clears the progressbar label association", async () => {
    function App() {
      const [labelId, setLabelId] = createSignal("label-a");
      const [showLabel, setShowLabel] = createSignal(true);

      return (
        <>
          <Progress.Root value={50}>
            {showLabel() ? <Progress.Label id={labelId()}>Battery level</Progress.Label> : null}
          </Progress.Root>
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

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-labelledby", "label-a");

    fireEvent.click(screen.getByRole("button", { name: "Change id" }));
    await flushMicrotasks();
    expect(progressbar).toHaveAttribute("aria-labelledby", "label-b");

    fireEvent.click(screen.getByRole("button", { name: "Remove label" }));
    await flushMicrotasks();
    expect(progressbar).not.toHaveAttribute("aria-labelledby");
  });

  it("throws a descriptive error when rendered outside <Progress.Root>", () => {
    render(() => (
      <Errored fallback={(error) => <span>{String(error())}</span>}>
        <Progress.Label />
      </Errored>
    ));
    expect(screen.getByText(/ProgressRootContext is missing/)).toHaveTextContent(
      "Progress parts must be placed within <Progress.Root>.",
    );
  });
});
