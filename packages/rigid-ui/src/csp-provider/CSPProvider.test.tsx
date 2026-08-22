import { afterEach, describe, expect, it } from "vite-plus/test";
import { cleanup, render } from "../../test/test-utils";
import { ScrollArea } from "../scroll-area";
import { CSPProvider } from "./CSPProvider";

function queryDisableScrollbarStyle() {
  const styles = Array.from(document.querySelectorAll("style"));
  return (
    styles.find((element) => element.textContent?.includes(".rigid-ui-disable-scrollbar")) ?? null
  );
}

describe("<CSPProvider />", () => {
  afterEach(() => {
    cleanup();
    for (const style of Array.from(document.querySelectorAll("style"))) {
      if (style.textContent?.includes(".rigid-ui-disable-scrollbar")) {
        style.remove();
      }
    }
  });

  it("does not render inline style tags when disableStyleElements is true", () => {
    render(() => (
      <CSPProvider disableStyleElements>
        <ScrollArea.Root>
          <ScrollArea.Viewport />
        </ScrollArea.Root>
      </CSPProvider>
    ));

    expect(queryDisableScrollbarStyle()).toBeNull();
  });

  it("applies nonce to inline style tags", () => {
    render(() => (
      <CSPProvider nonce="test-nonce">
        <ScrollArea.Root>
          <ScrollArea.Viewport />
        </ScrollArea.Root>
      </CSPProvider>
    ));

    const style = queryDisableScrollbarStyle();
    expect(style).not.toBeNull();
    expect(style).toHaveAttribute("nonce", "test-nonce");
  });

  it("renders inline style tags by default", () => {
    render(() => (
      <ScrollArea.Root>
        <ScrollArea.Viewport />
      </ScrollArea.Root>
    ));

    const style = queryDisableScrollbarStyle();
    expect(style).not.toBeNull();
    expect(style).not.toHaveAttribute("nonce");
  });
});
