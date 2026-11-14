import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { flushMicrotasks, render } from "../../../test/test-utils";
import { Accordion } from "../index";

// Ported from Base UI's `panel/AccordionPanel.test.tsx`. `describeConformance` is replaced with
// an explicit forwarding test and `React.Activity` has no Solid equivalent.

const PANEL_CONTENT = "This is panel content";

describe("<Accordion.Panel />", () => {
  it("forwards props, class, and ref to the panel element", async () => {
    let ref: HTMLElement | undefined;
    render(() => (
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel
            data-testid="panel"
            class="custom"
            ref={(element) => {
              ref = element;
            }}
          >
            {PANEL_CONTENT}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));
    await flushMicrotasks();

    const element = screen.getByTestId("panel");
    expect(element).toHaveClass("custom");
    expect(element).toHaveAttribute("role", "region");
    expect(element).toHaveAttribute("data-open");
    expect(ref).toBe(element);
  });

  it("warns when a panel enables hiddenUntilFound and disables keepMounted", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      render(() => (
        <Accordion.Root>
          <Accordion.Item>
            <Accordion.Panel hiddenUntilFound keepMounted={false}>
              {PANEL_CONTENT}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));
      await flushMicrotasks();

      expect(warnSpy).toHaveBeenCalledWith(
        "Base UI: The `keepMounted={false}` prop on an `Accordion.Panel` is ignored when `hiddenUntilFound` is enabled on the panel or root, since the panel must remain mounted while closed.",
      );
      expect(screen.getByText(PANEL_CONTENT).getAttribute("hidden")).toBe("until-found");
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("suppresses the initial keyframe animation when rendered open", async () => {
    // Base UI covers this through `renderToString`; there is no SSR harness in these suites,
    // so the same contract is asserted against the first client paint instead.
    render(() => (
      <Accordion.Root defaultValue={[0]}>
        <Accordion.Item value={0}>
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel
            data-testid="panel"
            style={{
              "animation-duration": "100ms",
              "animation-name": "panel-slide-down",
              "animation-timing-function": "linear",
            }}
          >
            {PANEL_CONTENT}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    const panel = screen.getByTestId("panel");
    expect(panel.style.animationName).toBe("none");
    expect(panel.style.animationDuration).toBe("100ms");

    // Once the panel has been closed, reopening replays the authored animation.
    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    await flushMicrotasks();
    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    await flushMicrotasks();

    expect(screen.getByTestId("panel").style.animationName).toBe("panel-slide-down");
  });

  it("passes root keepMounted to closed panels", () => {
    render(() => (
      <Accordion.Root keepMounted>
        <Accordion.Item value={0}>
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{PANEL_CONTENT}</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    expect(screen.getByText(PANEL_CONTENT)).toHaveAttribute("hidden");
  });

  it("passes root hiddenUntilFound to closed panels and allows panel overrides", () => {
    render(() => (
      <Accordion.Root hiddenUntilFound keepMounted>
        <Accordion.Item value={0}>
          <Accordion.Header>
            <Accordion.Trigger>Trigger 1</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{PANEL_CONTENT}</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value={1}>
          <Accordion.Header>
            <Accordion.Trigger>Trigger 2</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel hiddenUntilFound={false} keepMounted={false}>
            Overridden panel
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    expect(screen.getByText(PANEL_CONTENT).getAttribute("hidden")).toBe("until-found");
    expect(screen.queryByText("Overridden panel")).toBeNull();
  });

  it("keeps panel dimensions in CSS variables while open", async () => {
    render(() => (
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel data-testid="panel">{PANEL_CONTENT}</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));
    await flushMicrotasks();

    expect(screen.getByTestId("panel").style.getPropertyValue("--accordion-panel-height")).toBe(
      "auto",
    );
  });

  it("removes the panel from the DOM on close by default", async () => {
    render(() => (
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Accordion.Trigger>Trigger</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{PANEL_CONTENT}</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    await flushMicrotasks();

    expect(screen.queryByText(PANEL_CONTENT)).toBeNull();
  });
});
