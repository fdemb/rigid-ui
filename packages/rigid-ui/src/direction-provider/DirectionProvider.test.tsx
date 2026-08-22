import { render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { DirectionProvider } from "./DirectionProvider";
import { useDirection, type TextDirection } from "../internals/direction-context";

/** Port of `reference/base-ui/packages/react/src/direction-provider/DirectionProvider.test.tsx`. */
function DirectionProbe() {
  const direction = useDirection();
  return <span data-testid="direction">{direction()}</span>;
}

describe("<DirectionProvider />", () => {
  it("defaults useDirection to ltr outside a provider", () => {
    render(() => <DirectionProbe />);

    expect(screen.getByTestId("direction")).toHaveTextContent("ltr");
  });

  it("provides the configured direction to descendants", async () => {
    const [direction, setDirection] = createSignal<TextDirection>("rtl");
    render(() => (
      <DirectionProvider direction={direction()}>
        <DirectionProbe />
      </DirectionProvider>
    ));

    expect(screen.getByTestId("direction")).toHaveTextContent("rtl");

    setDirection("ltr");
    await Promise.resolve();
    expect(screen.getByTestId("direction")).toHaveTextContent("ltr");
  });
});
