import { createSignal, Errored } from "solid-js";
import { screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { ScrollArea } from "../index";
import { isJSDOM, render } from "../../../test/test-utils";

describe("<ScrollArea.Content />", () => {
  it("throws a descriptive error when rendered outside <ScrollArea.Viewport>", () => {
    let caught: unknown;
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <ScrollArea.Root>
          <ScrollArea.Content />
        </ScrollArea.Root>
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: <ScrollArea.Content> must be used within <ScrollArea.Viewport>.",
    );
  });

  it("forwards native props, class, style, and refs", () => {
    let contentRef: HTMLDivElement | undefined;

    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Viewport>
          <ScrollArea.Content
            ref={(element) => (contentRef = element)}
            class="content-class"
            data-testid="content"
            style={{ color: "red" }}
          />
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    ));

    const content = screen.getByTestId("content");
    expect(contentRef).toBe(content);
    expect(content).toHaveClass("content-class");
    expect(content).toHaveAttribute("role", "presentation");
    // The `min-width: fit-content` base style is preserved alongside the caller's.
    expect(content).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(content.style.minWidth).toBe("fit-content");
  });

  it.skipIf(isJSDOM)("recomputes overflow when observed content resizes", async () => {
    const [contentHeight, setContentHeight] = createSignal(50);

    render(() => (
      <ScrollArea.Root data-testid="root" style={{ width: "100px", height: "100px" }}>
        <ScrollArea.Viewport style={{ width: "100%", height: "100%" }}>
          <ScrollArea.Content data-testid="content" style={{ height: `${contentHeight()}px` }} />
        </ScrollArea.Viewport>
      </ScrollArea.Root>
    ));

    const root = screen.getByTestId("root");

    await waitFor(() => expect(root).not.toHaveAttribute("data-has-overflow-y"));

    setContentHeight(1000);

    await waitFor(() => expect(root).toHaveAttribute("data-has-overflow-y"));
  });
});
