import { createSignal } from "solid-js";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { flushMicrotasks, render } from "../../test/test-utils";
import { Separator } from "./index";

describe("<Separator />", () => {
  it("renders a visible div with the separator role and horizontal orientation", () => {
    render(() => <Separator />);
    const separator = screen.getByRole("separator");
    expect(separator.tagName).toBe("DIV");
    expect(separator).toBeVisible();
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
  });

  it.each<Separator.State["orientation"]>(["horizontal", "vertical"])(
    "supports %s orientation",
    (orientation) => {
      render(() => <Separator orientation={orientation} />);
      const separator = screen.getByRole("separator");
      expect(separator).toHaveAttribute("aria-orientation", orientation);
      expect(separator).toHaveAttribute("data-orientation", orientation);
      expect(separator).not.toHaveAttribute("orientation");
    },
  );

  it("forwards props, children, class, style, ref, and events", () => {
    let ref: HTMLDivElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Separator
        id="rule"
        class="rule"
        style={{ height: "2px" }}
        ref={(element) => {
          ref = element;
        }}
        onClick={onClick}
      >
        Content
      </Separator>
    ));
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("id", "rule");
    expect(separator).toHaveClass("rule");
    expect(separator.style.height).toBe("2px");
    expect(separator).toHaveTextContent("Content");
    expect(ref).toBe(separator);
    fireEvent.click(separator);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("supports a custom tag", () => {
    render(() => <Separator render="hr" />);
    expect(screen.getByRole("separator").tagName).toBe("HR");
  });

  it("keeps orientation, class, style, and render state reactive without rebuilding", async () => {
    const [orientation, setOrientation] = createSignal<Separator.State["orientation"] | undefined>(
      undefined,
    );
    const renderCallback = vi.fn<NonNullable<Exclude<Separator.Props["render"], string>>>(
      (props, state) => <div {...props} data-render-orientation={state.orientation} />,
    );
    render(() => (
      <Separator
        orientation={orientation()}
        class={(state) => state.orientation}
        style={(state) => ({ width: state.orientation === "horizontal" ? "100px" : "1px" })}
        render={renderCallback}
      />
    ));
    const separator = screen.getByRole("separator");
    for (const next of ["vertical", undefined] satisfies Array<
      Separator.State["orientation"] | undefined
    >) {
      setOrientation(next);
      await flushMicrotasks();
      const expected = next ?? "horizontal";
      expect(screen.getByRole("separator")).toBe(separator);
      expect(separator).toHaveAttribute("aria-orientation", expected);
      expect(separator).toHaveAttribute("data-orientation", expected);
      expect(separator).toHaveAttribute("data-render-orientation", expected);
      expect(separator).toHaveClass(expected);
      expect(separator.style.width).toBe(next === "vertical" ? "1px" : "100px");
    }
    expect(renderCallback).toHaveBeenCalledOnce();
  });

  it("allows consumers to override accessibility attributes", () => {
    render(() => <Separator role="none" aria-orientation={undefined} data-testid="decorative" />);
    expect(screen.getByTestId("decorative")).toHaveAttribute("role", "none");
    expect(screen.getByTestId("decorative")).not.toHaveAttribute("aria-orientation");
  });
});
