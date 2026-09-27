import { createEffect, createSignal, Errored } from "solid-js";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";
import { Tabs } from "../index";

describe("<Tabs.Tab />", () => {
  it("forwards props, class, style, ref, and events", async () => {
    let ref: HTMLButtonElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Tabs.Root value="1">
        <Tabs.List>
          <Tabs.Tab
            value="1"
            data-testid="tab"
            class={(state) => (state.active ? "active" : "idle")}
            style={{ color: "red" }}
            ref={(element) => {
              ref = element;
            }}
            onClick={onClick}
          >
            Tab
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
    ));
    await flushMicrotasks();
    const tab = screen.getByRole("tab");
    expect(tab.tagName).toBe("BUTTON");
    expect(tab).toHaveAttribute("type", "button");
    expect(tab).toHaveClass("active");
    expect(tab.style.color).toBe("red");
    expect(ref).toBe(tab);
    expect(tab).toHaveAttribute("data-active", "");
    expect(tab).toHaveAttribute("data-orientation", "horizontal");
    expect(tab).not.toHaveAttribute("value");
    fireEvent.click(tab);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("marks a disabled tab with aria-disabled and data-disabled but keeps it focusable", async () => {
    render(() => (
      <Tabs.Root value={0}>
        <Tabs.List>
          <Tabs.Tab value={0} />
          <Tabs.Tab value={1} disabled />
        </Tabs.List>
      </Tabs.Root>
    ));
    await flushMicrotasks();
    const [, disabledTab] = screen.getAllByRole("tab");
    expect(disabledTab).toHaveAttribute("aria-disabled", "true");
    expect(disabledTab).toHaveAttribute("data-disabled", "");
    expect(disabledTab).not.toHaveAttribute("disabled");
  });

  describe("prop: nativeButton", () => {
    it("renders as an anchor and toggles selection when `nativeButton` is false", async () => {
      render(() => (
        <Tabs.Root defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab
              nativeButton={false}
              render={(props) => <a {...props} href="#overview" />}
              value="overview"
            >
              Overview
            </Tabs.Tab>
            <Tabs.Tab
              nativeButton={false}
              render={(props) => <a {...props} href="#details" />}
              value="details"
            >
              Details
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0].tagName).toBe("A");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");

      fireEvent.click(tabs[1]);
      await flushMicrotasks();

      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("renders a tag through `render` and keeps the roving tab stop", async () => {
      render(() => (
        <Tabs.Root defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab nativeButton={false} render="span" value="overview">
              Overview
            </Tabs.Tab>
            <Tabs.Tab nativeButton={false} render="span" value="details">
              Details
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(screen.getAllByRole("tab").map((tab) => tab.tabIndex)).toEqual([0, -1]);
    });
  });

  it("throws a descriptive error when rendered outside <Tabs.List>", () => {
    let caught: unknown;
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <Tabs.Root>
          <Tabs.Tab value="1" />
        </Tabs.Root>
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.",
    );
  });

  describe("pointer interaction", () => {
    function renderTwoTabs(options: { disabledSecond?: boolean } = {}) {
      const handleValueChange = vi.fn();
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleValueChange}>
          <Tabs.List activateOnFocus>
            <Tabs.Tab value={0}>One</Tabs.Tab>
            <Tabs.Tab value={1} disabled={options.disabledSecond}>
              Two
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      return { handleValueChange, tabs: screen.getAllByRole("tab") };
    }

    // Mirrors the event sequence of a mouse press: pointerdown, mousedown, focus, then release.
    function press(target: HTMLElement, button: number, release = true) {
      fireEvent.pointerDown(target, { button });
      fireEvent.mouseDown(target, { button });
      target.focus();
      if (release) {
        fireEvent.pointerUp(target, { button });
        fireEvent.mouseUp(target, { button });
        if (button === 0) fireEvent.click(target, { button });
      }
    }

    it("does not re-commit the value when the active tab is pressed", async () => {
      const { handleValueChange, tabs } = renderTwoTabs();
      await flushMicrotasks();

      press(tabs[0], 0);
      await flushMicrotasks();

      expect(handleValueChange).not.toHaveBeenCalled();
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    it("does not activate a disabled tab that is pressed and focused", async () => {
      const { handleValueChange, tabs } = renderTwoTabs({ disabledSecond: true });
      await flushMicrotasks();

      press(tabs[1], 0);
      // Disabled tabs stay focusable, and `activateOnFocus` must not select them.
      tabs[1].focus();
      await flushMicrotasks();

      expect(tabs[1]).toHaveFocus();
      expect(handleValueChange).not.toHaveBeenCalled();
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });

    it("does not activate a tab focused by a held secondary-button press", async () => {
      const { handleValueChange, tabs } = renderTwoTabs();
      await flushMicrotasks();

      press(tabs[1], 2, false);
      await flushMicrotasks();

      expect(handleValueChange).not.toHaveBeenCalled();
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
      fireEvent.pointerUp(tabs[1], { button: 2 });
    });

    it("activates on focus again once a secondary-button press has ended", async () => {
      const { handleValueChange, tabs } = renderTwoTabs();
      await flushMicrotasks();

      press(tabs[1], 2);
      expect(handleValueChange).not.toHaveBeenCalled();

      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("activates on focus again once a secondary-button press is cancelled", async () => {
      const { handleValueChange, tabs } = renderTwoTabs();
      await flushMicrotasks();

      fireEvent.pointerDown(tabs[1], { button: 2 });
      fireEvent.pointerCancel(tabs[1]);

      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("keyboard activation", () => {
    async function renderAndMoveFocus() {
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab value={0}>One</Tabs.Tab>
            <Tabs.Tab value={1}>Two</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [firstTab, secondTab] = screen.getAllByRole("tab");
      firstTab.focus();
      fireEvent.keyDown(firstTab, { key: "ArrowRight" });
      await flushMicrotasks();

      expect(secondTab).toHaveFocus();
      expect(secondTab).toHaveAttribute("aria-selected", "false");
      return { firstTab, secondTab };
    }

    it("activates the focused tab with Space when `activateOnFocus` is false", async () => {
      const { firstTab, secondTab } = await renderAndMoveFocus();

      fireEvent.keyDown(secondTab, { key: " " });
      fireEvent.keyUp(secondTab, { key: " " });
      await flushMicrotasks();

      expect(secondTab).toHaveAttribute("aria-selected", "true");
      expect(firstTab).toHaveAttribute("aria-selected", "false");
    });

    it.skipIf(isJSDOM)(
      "activates the focused tab with Enter when `activateOnFocus` is false",
      async () => {
        const { userEvent } = await import("vite-plus/test/browser");
        const { firstTab, secondTab } = await renderAndMoveFocus();

        await userEvent.keyboard("{Enter}");
        await flushMicrotasks();

        expect(secondTab).toHaveAttribute("aria-selected", "true");
        expect(firstTab).toHaveAttribute("aria-selected", "false");
      },
    );
  });

  describe("state", () => {
    it.skipIf(isJSDOM)("exposes tab activation direction through the render prop", async () => {
      const states: Array<{ value: number; active: boolean; direction: string }> = [];
      const [value, setValue] = createSignal(0);
      const renderTab = (tabValue: number) => (props: object, state: Tabs.Tab.State) => {
        createEffect(
          () => ({ active: state.active, direction: state.tabActivationDirection }),
          (snapshot) => {
            states.push({ value: tabValue, ...snapshot });
          },
        );
        return <button {...props} />;
      };
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List>
            <Tabs.Tab value={0} render={renderTab(0)}>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1} render={renderTab(1)}>
              Tab 1
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();
      states.length = 0;

      setValue(1);
      await flushMicrotasks();

      expect(
        states.some((state) => state.value === 1 && state.active && state.direction === "right"),
      ).toBe(true);
    });
  });
});
