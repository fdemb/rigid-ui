import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render } from "../../../test/test-utils";
import { Meter } from "../index";

describe("<Meter.Track />", () => {
  it("forwards props, class, style, ref, events, and render props", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Meter.Root value={30}>
        <Meter.Track
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
});
