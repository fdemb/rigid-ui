import { createSignal, Errored, Show } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";
import { Tabs } from "../index";

describe("<Tabs.Panel />", () => {
  it("forwards props, class, style, and ref, and wires the tabpanel attributes", async () => {
    let ref: HTMLDivElement | undefined;
    render(() => (
      <Tabs.Root value="1">
        <Tabs.List>
          <Tabs.Tab value="1" />
        </Tabs.List>
        <Tabs.Panel
          value="1"
          keepMounted
          data-testid="panel"
          class="panel"
          style={{ color: "red" }}
          ref={(element) => {
            ref = element;
          }}
        />
      </Tabs.Root>
    ));
    await flushMicrotasks();
    const panel = screen.getByTestId("panel");
    expect(panel).toHaveAttribute("role", "tabpanel");
    expect(panel).toHaveClass("panel");
    expect(panel.style.color).toBe("red");
    expect(ref).toBe(panel);
    expect(panel).toHaveAttribute("tabindex", "0");
    expect(panel).toHaveAttribute("data-index", "0");
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).not.toHaveAttribute("inert");
    expect(panel).not.toHaveAttribute("value");
  });

  it("hides an inactive keepMounted panel and makes it inert", async () => {
    render(() => (
      <Tabs.Root value="1">
        <Tabs.List>
          <Tabs.Tab value="1" />
          <Tabs.Tab value="2" />
        </Tabs.List>
        <Tabs.Panel value="2" keepMounted data-testid="panel" />
      </Tabs.Root>
    ));
    await flushMicrotasks();
    const panel = screen.getByTestId("panel");
    expect(panel).toHaveAttribute("hidden");
    expect(panel).toHaveAttribute("data-hidden", "");
    expect(panel).toHaveAttribute("inert");
    expect(panel).toHaveAttribute("tabindex", "-1");
  });

  it("does not render an inactive panel without keepMounted", async () => {
    render(() => (
      <Tabs.Root value="1">
        <Tabs.List>
          <Tabs.Tab value="1" />
          <Tabs.Tab value="2" />
        </Tabs.List>
        <Tabs.Panel value="2" data-testid="panel" />
      </Tabs.Root>
    ));
    await flushMicrotasks();
    expect(screen.queryByTestId("panel")).toBe(null);
  });

  it("throws a descriptive error when rendered outside <Tabs.Root>", () => {
    let caught: unknown;
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <Tabs.Panel value="1" keepMounted />
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.",
    );
  });

  describe("panels sharing a value", () => {
    it("keeps the surviving registration when a shadowed panel unmounts", async () => {
      const [shadowedMounted, setShadowedMounted] = createSignal(true);
      render(() => (
        <Tabs.Root value="a">
          <Tabs.List>
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
          </Tabs.List>
          <Show when={shadowedMounted()}>
            <Tabs.Panel value="b" keepMounted data-testid="shadowed" />
          </Show>
          <Tabs.Panel value="b" keepMounted data-testid="owner" />
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabB = screen.getAllByRole("tab")[1];
      const owner = screen.getByTestId("owner");

      // The last panel to register owns the value.
      expect(tabB).toHaveAttribute("aria-controls", owner.id);

      setShadowedMounted(false);
      await flushMicrotasks();

      expect(screen.queryByTestId("shadowed")).toBe(null);
      expect(tabB).toHaveAttribute("aria-controls", owner.id);
    });
  });

  describe.skipIf(isJSDOM)("animations", () => {
    it("triggers enter animation via data-starting-style when mounting", async () => {
      let transitionFinished = false;
      const style = `
        .animation-test-panel {
          transition: opacity 1ms;
        }

        .animation-test-panel[data-starting-style],
        .animation-test-panel[data-ending-style] {
          opacity: 0;
        }
      `;

      render(() => (
        <div>
          <style>{style}</style>
          <Tabs.Root defaultValue="one">
            <Tabs.List>
              <Tabs.Tab value="one">One</Tabs.Tab>
              <Tabs.Tab value="two">Two</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="one">Panel one</Tabs.Panel>
            <Tabs.Panel
              class="animation-test-panel"
              data-testid="panel-two"
              onTransitionEnd={() => {
                transitionFinished = true;
              }}
              value="two"
            >
              Panel two
            </Tabs.Panel>
          </Tabs.Root>
        </div>
      ));
      await flushMicrotasks();

      expect(screen.queryByTestId("panel-two")).toBeNull();

      fireEvent.click(screen.getByRole("tab", { name: "Two" }));

      await waitFor(() => {
        expect(transitionFinished).toBe(true);
      });

      expect(screen.getByTestId("panel-two")).not.toBeNull();
    });

    it("applies data-ending-style before unmount", async () => {
      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }

        .animation-test-panel[data-ending-style] {
          animation: test-anim 100ms;
        }
      `;

      render(() => (
        <div>
          <style>{style}</style>
          <Tabs.Root defaultValue="one">
            <Tabs.List>
              <Tabs.Tab value="one">One</Tabs.Tab>
              <Tabs.Tab value="two">Two</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel class="animation-test-panel" data-testid="panel-one" value="one">
              Panel one
            </Tabs.Panel>
            <Tabs.Panel value="two">Panel two</Tabs.Panel>
          </Tabs.Root>
        </div>
      ));
      await flushMicrotasks();

      expect(screen.getByTestId("panel-one")).not.toBeNull();

      fireEvent.click(screen.getByRole("tab", { name: "Two" }));

      await waitFor(() => {
        const panel = screen.queryByTestId("panel-one");
        expect(panel).not.toBeNull();
        expect(panel).toHaveAttribute("data-ending-style");
      });

      await waitFor(() => {
        expect(screen.queryByTestId("panel-one")).toBeNull();
      });
    });
  });
});
